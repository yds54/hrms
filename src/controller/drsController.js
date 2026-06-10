const moment = require("moment-timezone");
const { DRS, HOLIDAY, DRSFACTOR, TEAMS, USER } = require("../model/modelIndex");
const { successResponse } = require("../utils/sucess");
const { paginate, paginateArray } = require("../utils/pagination");
const { AppError } = require("../utils/error");
const { getProjection } = require("../utils/projection");
const { TIMEZONES, ROLES } = require("../utils/enum");
const {
  getDayRange,
  getMonthRange,
  dateSearchQuery,
  formatDate,
} = require("../utils/dateFormat");
const { formatProfilePicture } = require("../utils/cloudinaryFormatUrl");
const { searchConditions } = require("../utils/searchHelper");

//================ TEAM MEMBER MAP HELPER =================
const addTeamMembers = (teams, memberMap) => {
  teams.forEach(({ members = [], projectManagers = [] }) => {
    const pmIds = new Set(projectManagers.map((pm) => pm._id.toString()));

    members.forEach((member) => {
      const memberId = member._id.toString();
      const existing = memberMap.get(memberId);
      if (!existing) {
        memberMap.set(memberId, {
          member,
          projectManagers: [...projectManagers],
          pmIds,
        });
        return;
      }

      projectManagers.forEach((pm) => {
        const pmId = pm._id.toString();
        if (!existing.pmIds.has(pmId)) {
          existing.pmIds.add(pmId);
          existing.projectManagers.push(pm);
        }
      });
    });
  });
};

//======================= ADD DRS =================================
exports.addDrs = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { date, onLeave, done, inProgress, factors = {} } = req.body;

    const { startOfDay } = getDayRange(date);

    const isDrsExists = await DRS.findOne({
      user: userId,
      date: startOfDay,
    }).select("_id");

    if (isDrsExists) {
      throw new AppError("DRS already submitted for this date", 409);
    }

    if (!onLeave && !(done || inProgress)) {
      throw new AppError("Either 'done' or 'inProgress' is required", 400);
    }

    // validate factors
    const allowedFactors = await DRSFACTOR.find({
      isDeleted: false,
    }).select("criteria");

    const allowedFactorSet = new Set(
      allowedFactors.map((item) => item.criteria),
    );

    // can only send factors that admin created
    for (const key of Object.keys(factors)) {
      if (!allowedFactorSet.has(key)) {
        throw new AppError(`${key} is not valid factor`, 500);
      }
    }

    const drs = await DRS.create({
      ...req.body,
      factors,
      date: startOfDay,
      user: userId,
      createdBy: userId,
      updatedBy: userId,
    });

    return successResponse(res, 201, "DRS added successfully", drs);
  } catch (error) {
    next(error);
  }
};

//========================= SHOW DRS ===============================
exports.getDrs = async (req, res, next) => {
  try {
    const { page, limit, month, year, search } = req.query;
    const { _id: userId } = req.user;

    const currentDate = new Date();

    const selectedMonth = month ? Number(month) : currentDate.getMonth();
    const selectedYear = year ? Number(year) : currentDate.getFullYear();

    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );

    const _where = {
      user: userId,
      isDeleted: false,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    };

    // search
    if (search) {
      const searchConditions = [
        { notes: { $regex: search, $options: "i" } },
        { done: { $regex: search, $options: "i" } },
        { inProgress: { $regex: search, $options: "i" } },
        { nextPlan: { $regex: search, $options: "i" } },
      ];
      // number search from factor
      if (!isNaN(search)) {
        const num = Number(search);
        searchConditions.push({
          $expr: {
            $in: [
              num,
              {
                $map: {
                  input: { $objectToArray: "$factors" },
                  in: "$$this.v",
                },
              },
            ],
          },
        });
      }

      // date search (YYYY-MM-DD)
      const dateQuery = dateSearchQuery("date", search);
      if (dateQuery) {
        searchConditions.push(dateQuery);
      }
      _where.$and = [{ $or: searchConditions }];
    }

    const { data, pagination } = await paginate({
      model: DRS,
      query: _where,
      page,
      limit,
      sort: { date: -1 },
      select: getProjection(["user", "createdBy"]),
    });

    return successResponse(res, 200, "DRS fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

//=================== DISPLAY DRS BY USER ID (ADMIN,PM) =========================
exports.getDrsByUserId = async (req, res, next) => {
  try {
    const { page, limit, month, year, search } = req.query;
    const { userId } = req.params;
    const { _id: loggedInUser, role } = req.user;

    const currentDate = new Date();
    const selectedMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? Number(year) : currentDate.getFullYear();
    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );

    const _where = {
      isDeleted: false,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    };

    //================ ROLE =================
    if (role === ROLES.ADMIN) {
      if (userId) {
        _where.user = userId;
      }
    } else if ([ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(role)) {
      const teamQuery = {
        isDeleted: false,
      };
      if (role === ROLES.PROJECT_MANAGER) {
        teamQuery.projectManagers = loggedInUser;
      } else {
        teamQuery.teamLeaders = loggedInUser;
      }
      const teams = await TEAMS.find(teamQuery).select("members");

      // team members
      const memberIds = teams.flatMap((t) =>
        t.members.map((m) => m.toString()),
      );
      if (!memberIds.length) {
        throw new AppError("No team members found", 404);
      }
      if (!memberIds.includes(userId)) {
        throw new AppError(
          "You are not authorized to access as they are not part of your team",
          403,
        );
      }
      _where.user = userId;
    } else {
      throw new AppError("You are not authorized user to access drs", 403);
    }

    //================ SEARCH =================
    if (search) {
      const searchConditions = [
        { notes: { $regex: search, $options: "i" } },
        { done: { $regex: search, $options: "i" } },
        { inProgress: { $regex: search, $options: "i" } },
        { nextPlan: { $regex: search, $options: "i" } },
      ];

      if (!isNaN(search)) {
        const num = Number(search);
        searchConditions.push({
          $expr: {
            $in: [
              num,
              {
                $map: {
                  input: { $objectToArray: "$factors" },
                  in: "$$this.v",
                },
              },
            ],
          },
        });
      }

      const dateQuery = dateSearchQuery("date", search);
      if (dateQuery) {
        searchConditions.push(dateQuery);
      }
      _where.$and = [{ $or: searchConditions }];
    }

    const { data, pagination } = await paginate({
      model: DRS,
      query: _where,
      page,
      limit,
      sort: { date: -1 },
      select: getProjection(["user", "createdBy"]),
    });

    return successResponse(res, 200, "DRS fetched successfully", {
      data,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

//======================== EDIT DRS =============================
exports.updateDrs = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { id } = req.params;

    const drs = await DRS.findOne({ _id: id, isDeleted: false });

    if (!drs) {
      throw new AppError("DRS not found with given Id", 404);
    }

    if (drs.user.toString() !== userId.toString()) {
      throw new AppError("You are not authorize to Update this Drs ", 403);
    }

    Object.assign(drs, req.body, { updatedBy: userId });
    await drs.save();

    return successResponse(res, 200, "DRS changed successfully");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//=============== NOT FILLED DRS ==========================
exports.getNotFilledDrs = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const { _id: userId } = req.user;

    const now = moment.tz(TIMEZONES.INDIA).subtract(1, "day");
    const selectedMonth = month ? Number(month) : now.month() + 1;
    const selectedYear = year ? Number(year) : now.year();

    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );

    // limit till yesterday (If current month-syesterday , past month → full month)
    const loopEnd = endOfMonth > now.toDate() ? now.toDate() : endOfMonth;
    const dateFilter = {
      $gte: startOfMonth,
      $lte: loopEnd,
    };

    const [drsData, holidays, userData] = await Promise.all([
      DRS.find({ user: userId, isDeleted: false, date: dateFilter }).lean(),
      HOLIDAY.find({
        isDeleted: false,
        holidayDate: dateFilter,
      }).lean(),
      USER.findOne({ _id: userId }).select("drsRequired").lean(),
    ]);

    if (!userData?.drsRequired) {
      return successResponse(res, 200, "DRS not required", { data: [] });
    }

    const holidaySet = new Set(holidays.map((h) => formatDate(h.holidayDate)));
    const drsMap = new Map(drsData.map((d) => [formatDate(d.date), d]));

    const result = [];
    let currentDay = moment(startOfMonth);

    while (currentDay.toDate() <= loopEnd) {
      const key = formatDate(currentDay.toDate());
      if (currentDay.day() !== 0 && !holidaySet.has(key)) {
        const record = drsMap.get(key);

        if (
          !record ||
          !(
            record.done?.trim() ||
            record.inProgress?.trim() ||
            record.nextPlan?.trim()
          )
        ) {
          result.push({ date: key, userId });
        }
      }
      currentDay.add(1, "day");
    }

    return successResponse(res, 200, "Not filled DRS fetched", {
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//================ TEAM NOT FILLED DRS =================
exports.getTeamNotFilledDrs = async (req, res, next) => {
  try {
    const { page, limit, month, year, search } = req.query;
    const { _id: userId, role } = req.user;
    const memberSearch = search ? searchConditions(search, "fullName") : {};

    const now = moment.tz(TIMEZONES.INDIA).subtract(1, "day");
    const selectedMonth = Number(month) || now.month() + 1;
    const selectedYear = Number(year) || now.year();
    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );
    const endDate = endOfMonth > now.toDate() ? now.toDate() : endOfMonth;
    const memberMap = new Map();

    //================ TEAM PIPELINE =================
    const teamMatch = { isDeleted: false };

    if (role === ROLES.PROJECT_MANAGER) {
      teamMatch.projectManagers = userId;
    }
    if (role === ROLES.TEAM_LEAD) {
      teamMatch.teamLeaders = userId;
    }

    const teamPipeline = [
      { $match: teamMatch },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                status: "active",
                isLeft: false,
                drsRequired: true,
                role: ROLES.USER,
                ...(search ? memberSearch : {}),
              },
            },
            {
              $project: {
                name: 1,
                profilePicture: 1,
              },
            },
          ],
          as: "members",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "projectManagers",
          foreignField: "_id",
          pipeline: [
            {
              $match: search ? memberSearch : {},
            },
            {
              $project: {
                name: 1,
                fullName: 1,
              },
            },
          ],
          as: "projectManagers",
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { members: { $ne: [] } },
                  { projectManagers: { $ne: [] } },
                ],
              },
            },
          ]
        : []),
    ];

    const teams = await TEAMS.aggregate(teamPipeline);

    //================ IF ADMIN LOGIN  =================
    if (role === ROLES.ADMIN) {
      const employees = await USER.find({
        isDeleted: false,
        status: "active",
        isLeft: false,
        drsRequired: true,
        role: {
          $in: [ROLES.USER, ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD],
        },
        ...(search ? memberSearch : {}),
      })
        .select("name profilePicture")
        .lean();

      employees.forEach((member) => {
        memberMap.set(member._id.toString(), {
          member,
          projectManagers: [],
          pmIds: new Set(),
        });
      });
    }

    if (teams.length) {
      addTeamMembers(teams, memberMap);
    }

    const memberIds = [...memberMap.keys()];

    if (!memberIds.length) {
      return successResponse(res, 200, "No employee found");
    }

    // MISSING DRS
    const [drsList, holidays] = await Promise.all([
      DRS.find({
        user: { $in: memberIds },
        isDeleted: false,
        date: { $gte: startOfMonth, $lte: endDate },
      }).lean(),

      HOLIDAY.find({
        isDeleted: false,
        holidayDate: { $gte: startOfMonth, $lte: endDate },
      }).lean(),
    ]);

    const holidaySet = new Set(
      holidays.map((holiday) => formatDate(holiday.holidayDate)),
    );

    const drsMap = new Map();
    drsList.forEach((drs) => {
      const memberId = drs.user.toString();
      if (!drsMap.has(memberId)) {
        drsMap.set(memberId, new Map());
      }
      drsMap.get(memberId).set(formatDate(drs.date), drs);
    });

    const result = memberIds.reduce((acc, memberId) => {
      const { member, projectManagers = [] } = memberMap.get(memberId);
      const userDrs = drsMap.get(memberId) || new Map();
      const missingDates = [];
      const current = moment(startOfMonth);

      while (current.toDate() <= endDate) {
        const date = formatDate(current.toDate());
        if (current.day() !== 0 && !holidaySet.has(date)) {
          const record = userDrs.get(date);
          if (
            !record ||
            !(
              record.done?.trim() ||
              record.inProgress?.trim() ||
              record.nextPlan?.trim()
            )
          ) {
            missingDates.push(date);
          }
        }
        current.add(1, "day");
      }

      if (missingDates.length) {
        const formattedMember = formatProfilePicture(member);
        acc.push({
          userId: member._id,
          employeeName: member.name,
          profilePicture: formattedMember.profilePicture.url,
          projectManagers,
          dates: missingDates,
          totalDays: missingDates.length,
        });
      }
      return acc;
    }, []);

    const { data, pagination } = paginateArray(result, page, limit);
    return successResponse(res, 200, "Team not filled DRS fetched", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

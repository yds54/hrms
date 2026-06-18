const mongoose = require("mongoose");
const moment = require("moment-timezone");
const {
  EVALUATIONREPORT,
  EVALUATIONCRITERIA,
  TEAMS,
  USER,
} = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { ROLES, TIMEZONES } = require("../utils/enum");
const {
  getMonthRange,
  getPreviousWeekRange,
  formatDate,
} = require("../utils/dateFormat");
const { getWeeksOfMonth } = require("../utils/getWeeksOfMonth");

//========================= UPSERT EVALUATION REPORT ==========================
exports.upsertEvaluationReport = async (req, res, next) => {
  try {
    const { _id: evaluatedBy, role } = req.user;
    const { userId, fromDate, toDate, criteria } = req.body;

    const isUserExists = await USER.findOne({
      _id: userId,
      isDeleted: false,
    }).select("_id");
    if (!isUserExists) {
      throw new AppError("User not found with given Id", 404);
    }

    if ([ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(role)) {
      const _where = {
        members: userId,
        isDeleted: false,
      };

      if (role === ROLES.PROJECT_MANAGER) {
        _where.projectManagers = evaluatedBy;
      } else {
        _where.teamLeaders = evaluatedBy;
      }

      const isMemberExists = await TEAMS.findOne(_where).select("_id");
      if (!isMemberExists) {
        throw new AppError(
          "You are not authorized, user is not part of your team.",
          403,
        );
      }
    }

    // criteria validation
    if (criteria.length) {
      const criteriaIds = criteria.map((c) => c.criteriaId);
      const validCriteriaCount = await EVALUATIONCRITERIA.countDocuments({
        _id: { $in: criteriaIds },
        isDeleted: false,
      });
      if (validCriteriaCount !== criteria.length) {
        throw new AppError("Invalid criteria", 400);
      }
    }

    // if record exist update otherwise insert
    const existingDoc = await EVALUATIONREPORT.findOne({
      userId,
      fromDate,
      toDate,
      isDeleted: false,
    });

    let result;

    if (existingDoc) {
      existingDoc.set({
        ...req.body,
        evaluatedBy,
      });
      result = await existingDoc.save();
    } else {
      result = await EVALUATIONREPORT.create({
        ...req.body,
        evaluatedBy,
      });
    }
    return successResponse(res, 200, "Evaluation saved successfully", {
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

//========================= GET EVALUATION REPORT ==========================
exports.getEvaluationReport = async (req, res, next) => {
  try {
    const { role, _id: loggedInUser } = req.user;
    let { month, year, userId } = req.query;

    if (!month || !year) {
      const current = moment.tz(TIMEZONES.INDIA);
      month = current.format("MM");
      year = current.format("YYYY");
    }
    const { startOfMonth, endOfMonth } = getMonthRange(
      Number(year),
      Number(month),
    );
    const query = {
      isDeleted: false,
      fromDate: { $gte: startOfMonth, $lte: endOfMonth },
    };

    // ================= ROLE WISE DISPLAY =================
    if (role === ROLES.USER) {
      query.userId = loggedInUser;
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

      const memberIds = teams.flatMap((t) =>
        t.members.map((id) => id.toString()),
      );

      if (userId && !memberIds.includes(userId)) {
        throw new AppError("User is not part of your team", 403);
      }

      query.userId = userId
        ? new mongoose.Types.ObjectId(userId)
        : {
            $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)),
          };
    } else if ([ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER].includes(role)) {
      if (userId) query.userId = new mongoose.Types.ObjectId(userId);
    } else {
      throw new AppError("You are not authorized to access this resource", 403);
    }

    const reports = await EVALUATIONREPORT.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      { $unwind: "$userId" },
      {
        $lookup: {
          from: "users",
          localField: "evaluatedBy",
          foreignField: "_id",
          as: "evaluatedBy",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      { $unwind: "$evaluatedBy" },
      {
        $lookup: {
          from: "evaluationcriterias",
          localField: "criteria.criteriaId",
          foreignField: "_id",
          as: "criteriaData",
          pipeline: [{ $project: { criteria: 1 } }],
        },
      },
      {
        $addFields: {
          criteria: {
            $map: {
              input: "$criteria",
              as: "c",
              in: {
                score: "$$c.score",
                criteria: {
                  $let: {
                    vars: {
                      match: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$criteriaData",
                              as: "cd",
                              cond: { $eq: ["$$cd._id", "$$c.criteriaId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$match.criteria",
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          criteriaData: 0,
          isDeleted: 0,
          __v: 0,
        },
      },
    ]);

    const reportMap = new Map(
      reports.map((r) => [
        `${formatDate(r.fromDate)}-${formatDate(r.toDate)}`,
        r,
      ]),
    );

    // ================= WEEKS =================
    const weeks = getWeeksOfMonth(Number(year), Number(month));

    // ================= FINAL =================
    const finalData = weeks.map(
      ({ key, formattedFromDate, formattedToDate }) => {
        const data = reportMap.get(key) || null;
        if (role === ROLES.USER && data) {
          delete data.privateNote;
        }
        return {
          fromDate: formattedFromDate,
          toDate: formattedToDate,
          data,
        };
      },
    );

    return successResponse(res, 200, "Evaluation fetched", {
      reports: finalData,
    });
  } catch (err) {
    next(err);
  }
};

//========================= GET REMAINING EVALUATION ==========================
exports.getRemainingEvaluation = async (req, res, next) => {
  try {
    const { _id: loggedInUser } = req.user;
    const { fromDate, toDate } = getPreviousWeekRange();

    const teamData = await TEAMS.aggregate([
      {
        $match: {
          $or: [
            {
              projectManagers: new mongoose.Types.ObjectId(loggedInUser),
            },
            {
              teamLeaders: new mongoose.Types.ObjectId(loggedInUser),
            },
          ],
          isDeleted: false,
        },
      },
      // project manager lookup
      {
        $lookup: {
          from: "users",
          localField: "projectManagers",
          foreignField: "_id",
          as: "projectManagers",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      // team lead lookup
      {
        $lookup: {
          from: "users",
          localField: "teamLeaders",
          foreignField: "_id",
          as: "teamLeaders",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      // team member lookup
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      { $unwind: "$members" },
      {
        $project: {
          userId: "$members._id",
          name: "$members.name",
          teamLead: { $arrayElemAt: ["$teamLeaders.name", 0] },
          projectManager: { $arrayElemAt: ["$projectManagers", 0] },
        },
      },
      {
        $group: {
          _id: "$userId",
          name: { $first: "$name" },
          teamLead: { $first: "$teamLead" },
          projectManager: { $first: "$projectManager" },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: 1,
          teamLead: 1,
          projectManager: 1,
        },
      },
    ]);

    const memberIds = teamData.map((t) => t.userId);

    const reports = await EVALUATIONREPORT.find({
      userId: { $in: memberIds },
      fromDate,
      toDate,
      isDeleted: false,
    }).select("userId");
    const evaluatedUserIds = new Set(reports.map((r) => r.userId.toString()));

    const remaining = teamData
      .filter((u) => !evaluatedUserIds.has(u.userId.toString()))
      .map((u) => ({
        userId: u.userId,
        name: u.name,
        projectManager: u.projectManager || null,
        teamLead: u.teamLead || null,
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
      }));

    return successResponse(res, 200, "Remaining evaluation fetched", {
      data: remaining,
    });
  } catch (err) {
    next(err);
  }
};

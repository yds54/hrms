const moment = require("moment-timezone");
const mongoose = require("mongoose");
const { LEAVE, TEAMS, USER } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const {
  formatProfilePicture,
  formatLeaveUser,
} = require("../utils/cloudinaryFormatUrl");
const { searchConditions } = require("../utils/searchHelper");
const {
  LEAVE_DAY_TYPE,
  LEAVE_DURATION,
  ROLES,
  LEAVE_STATUS,
  TIMEZONES,
} = require("../utils/enum");
const {
  getDayRange,
  getMonthRange,
  dateSearchQuery,
  getYearRange,
} = require("../utils/dateFormat");
const {
  leaveRequestCreatedNotification,
  leaveApprovedNotification,
  leaveDeclinedNotification,
} = require("../services/notificationEventService");

//======================= SEND LEAVE REQUEST =================================
exports.createLeaveRequest = async (req, res, next) => {
  try {
    const { _id: user, officeTiming } = req.user;
    const {
      reasonType,
      reason,
      numberOfDays,
      date,
      isFullDay,
      fromTime,
      toTime,
      fromDate,
      toDate,
    } = req.body;
    const payload = { user, reason, reasonType, numberOfDays };

    const orConditions = [];
    if (date) {
      const { startOfDay, endOfDay } = getDayRange(date);
      orConditions.push({
        date: { $gte: startOfDay, $lte: endOfDay },
      });
    }
    if (fromDate && toDate) {
      const { startOfDay: start } = getDayRange(fromDate);
      const { endOfDay: end } = getDayRange(toDate);
      orConditions.push({
        fromDate: { $lte: end },
        toDate: { $gte: start },
      });
    }

    if (numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
      if (!date) throw new AppError("Date is required", 422);
      const { startOfDay } = getDayRange(date);
      payload.date = startOfDay;
      payload.isFullDay = isFullDay === true;

      if (payload.isFullDay) {
        payload.fromTime = officeTiming?.entryTime || null;
        payload.toTime = officeTiming?.exitTime || null;
      } else {
        if (!fromTime || !toTime) {
          throw new AppError("From Time and To Time required", 422);
        }
        payload.fromTime = moment(fromTime, "HH:mm A").format("hh:mm A");
        payload.toTime = moment(toTime, "HH:mm A").format("hh:mm A");
      }
    }

    // Multiple Day
    if (numberOfDays === LEAVE_DAY_TYPE.MULTIPLE) {
      if (!fromDate || !toDate || !fromTime || !toTime) {
        throw new AppError("From and To date required", 422);
      }

      const { startOfDay: startDate } = getDayRange(fromDate);
      const { endOfDay: endDate } = getDayRange(toDate);

      if (endDate < startDate) {
        throw new AppError("Invalid Date range", 400);
      }

      payload.fromDate = startDate;
      payload.toDate = endDate;
      payload.fromTime = moment(fromTime, "HH:mm A").format("hh:mm A");
      payload.toTime = moment(toTime, "HH:mm A").format("hh:mm A");
    }
    const leave = await LEAVE.create(payload);

    await leaveRequestCreatedNotification(leave, req.user);

    return successResponse(res, 201, "Leave request created", {
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

//===================== LEAVE REQUEST HISTORY ============================
exports.getLeaveHistory = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    let { page, limit, year, filter, search } = req.query;
    const _where = {
      isDeleted: false,
      user: userId,
    };
    const conditions = [];

    // search by year
    if (year) {
      const { startOfYear, endOfYear } = getYearRange(Number(year));
      conditions.push({
        $or: [
          { date: { $gte: startOfYear, $lte: endOfYear } },
          {
            fromDate: { $lte: endOfYear },
            toDate: { $gte: startOfYear },
          },
        ],
      });
    }

    if (filter) {
      const monthIndex = moment(filter, "MMMM", true).month();
      if (!isNaN(monthIndex)) {
        const { startOfMonth, endOfMonth } = getMonthRange(
          moment().year(),
          monthIndex + 1,
        );
        conditions.push({
          $or: [
            { date: { $gte: startOfMonth, $lte: endOfMonth } },
            {
              fromDate: { $lte: endOfMonth },
              toDate: { $gte: startOfMonth },
            },
          ],
        });
      } else if (
        [LEAVE_DURATION.HALF, LEAVE_DAY_TYPE.SINGLE].includes(filter)
      ) {
        conditions.push({
          numberOfDays: LEAVE_DAY_TYPE.SINGLE,
          isFullDay: filter === LEAVE_DURATION.HALF ? false : true,
        });
      } else {
        conditions.push({
          numberOfDays: LEAVE_DAY_TYPE.MULTIPLE,
        });
      }
    }

    if (conditions.length) {
      _where.$and = conditions;
    }

    const pipeline = [
      { $match: _where },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
          pipeline: [
            { $match: { isDeleted: false } },
            {
              $project: {
                name: 1,
                fullName: 1,
                employeeCode: 1,
                profilePicture: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$user" },
      // search
      ...(search
        ? (() => {
            const dateQuery = dateSearchQuery("date", search);
            const fromDateQuery = dateSearchQuery("fromDate", search);
            return [
              {
                $match: {
                  $or: [
                    searchConditions(search, "user.fullName"),
                    {
                      "user.employeeCode": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    { reasonType: { $regex: search, $options: "i" } },
                    { reason: { $regex: search, $options: "i" } },
                    { numberOfDays: { $regex: search, $options: "i" } },
                    { declineReason: { $regex: search, $options: "i" } },
                    ...(dateQuery ? [dateQuery] : []),
                    ...(fromDateQuery ? [fromDateQuery] : []),
                  ],
                },
              },
            ];
          })()
        : []),
      {
        $lookup: {
          from: "users",
          localField: "approvedByPM",
          foreignField: "_id",
          as: "approvedByPM",
          pipeline: [{ $project: { name: 1, role: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$approvedByPM",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvedByHR",
          foreignField: "_id",
          as: "approvedByHR",
          pipeline: [{ $project: { name: 1, role: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$approvedByHR",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "declinedBy",
          foreignField: "_id",
          as: "declinedBy",
          pipeline: [{ $project: { name: 1, role: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$declinedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          reasonType: 1,
          reason: 1,
          numberOfDays: 1,
          date: 1,
          isFullDay: 1,
          fromDate: 1,
          toDate: 1,
          fromTime: 1,
          toTime: 1,
          declineReason: 1,
          declinedBy: 1,
          isPMApproved: 1,
          approvedByPM: 1,
          approvedByHR: 1,
          isHRApproved: 1,
          approvedBy: 1,
          createdAt: 1,
          totalDays: 1,
          user: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const { data, pagination } = await paginate({
      model: LEAVE,
      pipeline,
      page,
      limit,
    });

    const formatted = data.map(formatLeaveUser);

    return successResponse(res, 200, "Leave history fetched", {
      data: formatted,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

//======================== LEAVE REQUEST APPROVE ==========================
exports.updateLeaveRequest = async (req, res, next) => {
  try {
    const { _id: userId, role } = req.user;
    const { id } = req.params;
    const payload = { ...req.body };

    const leave = await LEAVE.findOne({
      _id: id,
      isDeleted: false,
    }).populate("user", "fullName");

    if (!leave) throw new AppError("Leave not found with given Id", 404);

    const approvingUser = await USER.findOne({
      _id: userId,
      isDeleted: false,
    }).select("fullName");

    if ([ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(role)) {
      const isTeamMember = await TEAMS.exists({
        isDeleted: false,
        members: leave.user._id,
        $or: [{ projectManagers: userId }, { teamLeaders: userId }],
      });
      if (!isTeamMember) {
        throw new AppError("You can approve only your team member leave", 403);
      }
    }

    if (
      [ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(role) &&
      payload.isHRApproved
    ) {
      throw new AppError("PM have not authorize to HR approval", 403);
    }

    //--------------- Decline ---------------
    // if decline reason is required
    if (
      payload.isPMApproved === LEAVE_STATUS.DECLINED ||
      payload.isHRApproved === LEAVE_STATUS.DECLINED
    ) {
      if (!payload.declineReason) {
        throw new AppError("Decline reason is required", 422);
      }
      payload.declined = true;
      payload.declinedBy = userId;
      await leaveDeclinedNotification({
        leave,
        approverName: approvingUser.fullName,
      });
    }

    // if pmapproved - declined , hrapproved auto - declined
    if (payload.isPMApproved === LEAVE_STATUS.DECLINED) {
      payload.isHRApproved = LEAVE_STATUS.DECLINED;
    }

    //--------------- Approve ----------------
    //if hrapproved - approved , pmapproved auto - approved
    // PM Approval
    if (
      [ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(role) &&
      payload.isPMApproved === LEAVE_STATUS.APPROVED
    ) {
      payload.approvedByPM = userId;
      await leaveApprovedNotification({
        leave,
        approverName: approvingUser.fullName,
      });
    }

    // HR/Admin Approval
    if (
      [ROLES.ADMIN, ROLES.HR].includes(role) &&
      payload.isHRApproved === LEAVE_STATUS.APPROVED
    ) {
      payload.isPMApproved = LEAVE_STATUS.APPROVED;
      if (!leave.approvedByPM) {
        payload.approvedByPM = userId;
      }
      payload.approvedByHR = userId;
      await leaveApprovedNotification({
        leave,
        approverName: approvingUser.fullName,
      });
    }

    await LEAVE.updateOne({ _id: id }, { $set: payload });
    return successResponse(res, 200, "Leave updated successfully");
  } catch (err) {
    next(err);
  }
};

//======================== DELETE LEAVE REQUEST ===============================
exports.deleteLeaveRequest = async (req, res, next) => {
  try {
    const { id: leaveId } = req.params;

    const isLeaveExists = await LEAVE.findOne({
      _id: leaveId,
      isDeleted: false,
    }).select("_id");

    if (!isLeaveExists)
      throw new AppError("Leave Request not found with given Id", 404);

    await LEAVE.updateOne(
      { _id: leaveId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );

    return successResponse(res, 200, "Leave Request deleted Sucessfully");
  } catch (error) {
    next(error);
  }
};

//===================== TEAM LEAVE REQUESTS (PM) ============================
exports.getTeamLeaveRequests = async (req, res, next) => {
  try {
    const { _id: userId, role } = req.user;
    let { page, limit, search, pmFilter, hrFilter, year, filter } = req.query;

    const _where = {
      isDeleted: false,
    };

    if (role === ROLES.HR) {
      _where.user = {
        $ne: userId,
      };
    }

    if (![ROLES.ADMIN, ROLES.HR].includes(role)) {
      const teams = await TEAMS.find({
        isDeleted: false,
        $or: [{ projectManagers: userId }, { teamLeaders: userId }],
      })
        .select("members")
        .lean();

      const memberIdsSet = new Set();
      for (const team of teams) {
        for (const memberId of team.members || []) {
          memberIdsSet.add(memberId.toString());
        }
      }

      const memberIds = [...memberIdsSet].map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      if (!memberIds.length) {
        return successResponse(res, 200, "No team member assigned to you", {
          data: [],
        });
      }

      _where.user = { $in: memberIds };
    }

    const conditions = [];

    // -------- filter year --------
    if (year) {
      const { startOfYear, endOfYear } = getYearRange(Number(year));
      conditions.push({
        $or: [
          { date: { $gte: startOfYear, $lte: endOfYear } },
          {
            fromDate: { $lte: endOfYear },
            toDate: { $gte: startOfYear },
          },
        ],
      });
    }

    // -------- filter month  --------
    if (filter) {
      const monthIndex = moment(filter, "MMMM", true).month();
      const currentYear = moment.tz(TIMEZONES.INDIA).year();
      if (!isNaN(monthIndex)) {
        const { startOfMonth, endOfMonth } = getMonthRange(
          currentYear,
          monthIndex + 1,
        );
        conditions.push({
          $or: [
            { date: { $gte: startOfMonth, $lte: endOfMonth } },
            {
              fromDate: { $lte: endOfMonth },
              toDate: { $gte: startOfMonth },
            },
          ],
        });
      }
    }

    // -------- PM filter --------
    if (pmFilter && pmFilter !== "All") {
      conditions.push({
        isPMApproved: pmFilter,
      });
    }

    // -------- HR filter --------
    if (hrFilter && hrFilter !== "All") {
      conditions.push({
        isHRApproved: hrFilter,
      });
    }

    if (conditions.length) {
      _where.$and = _where.$and ? [..._where.$and, ...conditions] : conditions;
    }

    const pipeline = [
      { $match: _where },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
          pipeline: [
            { $match: { isDeleted: false } },
            {
              $project: {
                name: 1,
                employeeCode: 1,
                fullName: 1,
                profilePicture: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$user" },
      // search
      ...(search
        ? (() => {
            const dateQuery = dateSearchQuery("date", search);
            const fromDateQuery = dateSearchQuery("fromDate", search);
            return [
              {
                $match: {
                  $or: [
                    { reasonType: { $regex: search, $options: "i" } },
                    { reason: { $regex: search, $options: "i" } },
                    { numberOfDays: { $regex: search, $options: "i" } },
                    { declineReason: { $regex: search, $options: "i" } },
                    {
                      "user.employeeCode": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    {
                      "user.fullName": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    ...(dateQuery ? [dateQuery] : []),
                    ...(fromDateQuery ? [fromDateQuery] : []),
                  ],
                },
              },
            ];
          })()
        : []),
      {
        $lookup: {
          from: "users",
          localField: "approvedByPM",
          foreignField: "_id",
          as: "approvedByPM",
          pipeline: [{ $project: { name: 1, role: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$approvedByPM",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvedByHR",
          foreignField: "_id",
          as: "approvedByHR",
          pipeline: [{ $project: { name: 1, role: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$approvedByHR",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "declinedBy",
          foreignField: "_id",
          as: "declinedBy",
          pipeline: [{ $project: { name: 1, role: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$declinedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          reasonType: 1,
          reason: 1,
          numberOfDays: 1,
          date: 1,
          isFullDay: 1,
          fromDate: 1,
          toDate: 1,
          fromTime: 1,
          toTime: 1,
          declineReason: 1,
          declinedBy: 1,
          isPMApproved: 1,
          isHRApproved: 1,
          approvedByPM: 1,
          approvedByHR: 1,
          createdAt: 1,
          totalDays: 1,
          user: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const { data, pagination } = await paginate({
      model: LEAVE,
      pipeline,
      page,
      limit,
    });

    const formatted = data.map(formatLeaveUser);

    return successResponse(res, 200, "Team leave requests fetched", {
      data: formatted,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ================= TODAY ON LEAVE =================
exports.getTodayOnLeave = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getDayRange(
      moment.tz(TIMEZONES.INDIA).format("YYYY-MM-DD"),
    );

    const data = await LEAVE.aggregate([
      {
        $match: {
          isDeleted: false,
          isPMApproved: LEAVE_STATUS.APPROVED,
          isHRApproved: LEAVE_STATUS.APPROVED,
          $or: [
            {
              date: { $gte: startOfDay, $lte: endOfDay },
            },
            {
              fromDate: { $lte: endOfDay },
              toDate: { $gte: startOfDay },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $match: { isDeleted: false },
            },
            {
              $lookup: {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "department",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      departmentName: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$department",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                name: 1,
                profilePicture: 1,
                departmentName: "$department.departmentName",
              },
            },
          ],
        },
      },

      {
        $unwind: "$user",
      },
      {
        $project: {
          numberOfDays: 1,
          isFullDay: 1,
          fromTime: 1,
          toTime: 1,
          name: "$user.name",
          department: "$user.departmentName",
          profilePicture: "$user.profilePicture",
        },
      },
    ]);

    const formatted = data.map((item) => {
      const user = formatProfilePicture({
        profilePicture: item.profilePicture,
      });

      return {
        name: item.name,
        department: item.department,
        profilePicture: user.profilePicture,
        leaveType:
          item.numberOfDays === LEAVE_DAY_TYPE.SINGLE
            ? item.isFullDay
              ? "FULL"
              : "HALF"
            : "MULTIPLE",
        leaveTiming: item.isFullDay
          ? "-"
          : `${item.fromTime} to ${item.toTime}`,
      };
    });

    return successResponse(res, 200, "Today on leave fetched", {
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

//===================== TODAY DIDN'T COME =============================
exports.getTodayDidntCome = async (req, res, next) => {
  try {
    const today = moment.tz(TIMEZONES.INDIA).format("YYYY-MM-DD");
    const { startOfDay, endOfDay } = getDayRange(today);

    const data = await USER.aggregate([
      {
        $match: {
          isDeleted: false,
          role: { $ne: ROLES.ADMIN },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                departmentName: 1,
              },
            },
          ],
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "attendances",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                date: {
                  $gte: startOfDay,
                  $lte: endOfDay,
                },
                isDeleted: false,
              },
            },
          ],
          as: "attendance",
        },
      },
      {
        $lookup: {
          from: "leaverequests",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$user", "$$userId"] },
                isDeleted: false,
                isPMApproved: LEAVE_STATUS.PENDING,
                $or: [
                  {
                    date: {
                      $gte: startOfDay,
                      $lte: endOfDay,
                    },
                  },
                  {
                    fromDate: { $lte: endOfDay },
                    toDate: { $gte: startOfDay },
                  },
                ],
              },
            },
          ],
          as: "pendingLeave",
        },
      },
      {
        $lookup: {
          from: "teams",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                isDeleted: false,
                $expr: {
                  $in: ["$$userId", "$members"],
                },
              },
            },
            {
              $project: {
                projectManagers: 1,
              },
            },
          ],
          as: "team",
        },
      },
      {
        $addFields: {
          projectManagerId: {
            $arrayElemAt: [
              {
                $arrayElemAt: ["$team.projectManagers", 0],
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "projectManagerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
          as: "projectManager",
        },
      },
      {
        $unwind: {
          path: "$projectManager",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              attendance: { $size: 0 },
            },
            {
              "attendance.0.inTime": {
                $in: [null, ""],
              },
            },
            {
              "pendingLeave.0": {
                $exists: true,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          department: "$department.departmentName",
          profilePicture: 1,
          projectManager: {
            _id: "$projectManager._id",
            name: {
              $ifNull: [
                "$projectManager.name",
                {
                  firstName: "-",
                  middleName: "",
                  lastName: "",
                },
              ],
            },
          },
        },
      },
      {
        $sort: {
          "name.firstName": 1,
        },
      },
    ]);

    const formatted = data.map((item) => ({
      ...item,
      profilePicture:
        formatProfilePicture({
          profilePicture: item.profilePicture,
        }).profilePicture || null,
    }));

    return successResponse(res, 200, "Today didn't come fetched", {
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

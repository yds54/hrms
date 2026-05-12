const moment = require("moment-timezone");
const { LEAVE, TEAMS } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { getProjection } = require("../utils/projection");
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

//======================= SEND LEAVE REQUEST =================================
exports.createLeaveRequest = async (req, res, next) => {
  try {
    const { _id: user } = req.user;
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

    const isExistingLeave =
      orConditions.length > 0 &&
      (await LEAVE.findOne({
        user,
        isDeleted: false,
        $or: orConditions,
      }));
    if (isExistingLeave) {
      throw new AppError("Leave already exists for selected date", 409);
    }

    if (numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
      if (!date) throw new AppError("Date is required", 400);
      const { startOfDay } = getDayRange(date);
      payload.date = startOfDay;
      payload.isFullDay = isFullDay === true;

      if (!payload.isFullDay) {
        if (!fromTime || !toTime) {
          throw new AppError("From Time and To Time required", 400);
        }
        payload.fromTime = moment(fromTime, "HH:mm A").format("hh:mm A");
        payload.toTime = moment(toTime, "HH:mm A").format("hh:mm A");
      }
    }

    // Multiple Day
    if (numberOfDays === LEAVE_DAY_TYPE.MULTIPLE) {
      if (!fromDate || !toDate || !fromTime || !toTime) {
        throw new AppError("From and To date required", 400);
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
    return successResponse(res, 201, "Leave request created", {
      data: leave,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Leave already exists for this date", 409));
    }
    next(error);
  }
};

//===================== LEAVE REQUEST HISTORY ============================
exports.getLeaveHistory = async (req, res, next) => {
  try {
    const { _id: userId, role } = req.user;
    let { page, limit, year, filter, search, pmFilter, hrFilter } = req.query;
    const _where = { isDeleted: false };
    if (![ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER].includes(role)) {
      _where.user = userId;
    }
    const conditions = [];

    //search
    if (search) {
      const fields = ["reasonType", "reason", "numberOfDays", "declineReason"];

      const searchCondition = fields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));

      // date search
      const dateQuery = dateSearchQuery("date", search);
      const fromDateQuery = dateSearchQuery("fromDate", search);

      if (dateQuery) searchCondition.push(dateQuery);
      if (fromDateQuery) searchCondition.push(fromDateQuery);

      _where.$and = [{ $or: searchCondition }];
    }

    // search by year
    if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      conditions.push({
        $or: [
          { date: { $gte: start, $lte: end } },
          {
            fromDate: { $lte: end },
            toDate: { $gte: start },
          },
        ],
      });
    }

    if (filter) {
      const monthIndex = moment(filter, "MMMM", true).month();
      if (!isNaN(monthIndex)) {
        const { startOfMonth, endOfMonth } = getMonthRange(
          new Date().getFullYear(),
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

    //PM filter
    if (pmFilter && [ROLES.ADMIN, ROLES.PROJECT_MANAGER].includes(role)) {
      if (pmFilter !== "All") {
        conditions.push({
          isPMApproved: pmFilter,
        });
      }
    }

    //HR filter
    if (hrFilter && [ROLES.ADMIN, ROLES.HR].includes(role)) {
      if (hrFilter !== "All") {
        conditions.push({
          isHRApproved: hrFilter,
        });
      }
    }

    if (conditions.length) {
      _where.$and = _where.$and ? [..._where.$and, ...conditions] : conditions;
    }

    const { data, pagination } = await paginate({
      model: LEAVE,
      query: _where,
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: "user",
          select: "profilePicture employeeCode name",
          match: { isDeleted: false },
          options: { lean: true },
        },
      ],
      select: getProjection(),
    });
    return successResponse(res, 200, "Leave history fetched", {
      data,
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

    const isLeaveExists = await LEAVE.findOne({ _id: id, isDeleted: false });
    if (!isLeaveExists)
      throw new AppError("Leave not found with given Id", 404);

    if (![ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER].includes(role)) {
      throw new AppError("You are not Authorize to Approve Leave", 403);
    }

    if (role === ROLES.PROJECT_MANAGER) {
      const isTeamMember = await TEAMS.exists({
        isDeleted: false,
        projectManagers: userId,
        members: isLeaveExists.user,
      });
      if (!isTeamMember) {
        throw new AppError("You can approve only your team member leave", 403);
      }
    }

    if (role === ROLES.PROJECT_MANAGER && payload.isHRApproved) {
      throw new AppError("PM have not authorize to HR approval", 403);
    }

    //--------------- Decline ---------------
    // if decline reason is required
    if (
      payload.isPMApproved === LEAVE_STATUS.DECLINED ||
      payload.isHRApproved === LEAVE_STATUS.DECLINED
    ) {
      if (!payload.declineReason) {
        throw new AppError("Decline reason is required", 400);
      }
      payload.declined = true;
      payload.declinedBy = userId;
    }

    // if pmapproved - declined , hrapproved auto - declined
    if (payload.isPMApproved === LEAVE_STATUS.DECLINED) {
      payload.isHRApproved = LEAVE_STATUS.DECLINED;
    }

    //--------------- Approve ----------------
    //if hrapproved - approved , pmapproved auto - approved
    if (
      [ROLES.ADMIN, ROLES.HR].includes(role) &&
      payload.isHRApproved === LEAVE_STATUS.APPROVED
    ) {
      payload.isPMApproved = LEAVE_STATUS.APPROVED;
      payload.approvedBy = userId;
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
    const { _id: userId } = req.user;
    let { page, limit, search, pmFilter, hrFilter, year, filter } = req.query;

    // -------- get team members --------
    const teams = await TEAMS.find({
      isDeleted: false,
      projectManagers: userId,
    })
      .select("members")
      .lean();

    const memberIdsSet = new Set();
    for (const team of teams) {
      for (const memberId of team.members || []) {
        memberIdsSet.add(memberId.toString());
      }
    }
    const memberIds = [...memberIdsSet];

    if (!memberIds.length) {
      return successResponse(res, 200, "No team member assigned to you", {
        data: [],
      });
    }

    const _where = {
      isDeleted: false,
      user: { $in: memberIds },
    };

    const conditions = [];

    // -------- search filed --------
    if (search) {
      const fields = ["reasonType", "reason", "numberOfDays", "declineReason"];
      const searchCondition = fields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
      const dateQuery = dateSearchQuery("date", search);
      const fromDateQuery = dateSearchQuery("fromDate", search);
      if (dateQuery) searchCondition.push(dateQuery);
      if (fromDateQuery) searchCondition.push(fromDateQuery);
      _where.$and = [{ $or: searchCondition }];
    }

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

    const { data, pagination } = await paginate({
      model: LEAVE,
      query: _where,
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: "user",
          select: "profilePicture employeeCode name",
          match: {
            isDeleted: false,
          },
          options: { lean: true },
        },
      ],
    });

    return successResponse(res, 200, "Team leave requests fetched", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const moment = require("moment-timezone");
const { LEAVE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { getProjection } = require("../utils/projection");
const { LEAVE_DAY_TYPE, LEAVE_DURATION } = require("../utils/enum");
const {
  getDayRange,
  getMonthRange,
  dateSearchQuery,
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
    const { _id: userId } = req.user;
    let { page, limit, year, filter, search } = req.query;
    const _where = { user: userId, isDeleted: false };
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

    if (conditions.length) {
      _where.$and = conditions;
    }

    const { data, pagination } = await paginate({
      model: LEAVE,
      query: _where,
      page,
      limit,
      sort: { createdAt: -1 },
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

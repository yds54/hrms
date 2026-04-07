// const moment = require("moment");
const { LEAVE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { getProjection } = require("../utils/projection");
const { LEAVE_DAY_TYPE, LEAVE_DURATION, TIMEZONES } = require("../utils/enum");
const moment = require("moment-timezone");

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

    if (numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
      if (!date) throw new AppError("Date is required", 400);
      payload.date = moment(date, "YYYY-MM-DD").startOf("day").toDate();
      payload.isFullDay = isFullDay === true;

      if (!payload.isFullDay) {
        if (!fromTime || !toTime) {
          throw new AppError("From Time and To Time required", 400);
        }
        payload.fromTime = moment(fromTime, "HH:mm").format("hh:mm A");
        payload.toTime = moment(toTime, "HH:mm").format("hh:mm A");
      }
    }

    // Multiple Day
    if (numberOfDays === LEAVE_DAY_TYPE.MULTIPLE) {
      if (!fromDate || !toDate || !fromTime || !toTime) {
        throw new AppError("From and To date required", 400);
      }

      const startdate = moment
        .tz(fromDate, "YYYY-MM-DD", TIMEZONES.INDIA)
        .startOf("day");
      const enddate = moment
        .tz(toDate, "YYYY-MM-DD", TIMEZONES.INDIA)
        .endOf("day");

      if (enddate.isBefore(startdate)) {
        throw new AppError("Invalid Date range", 400);
      }

      payload.fromDate = startdate.toDate();
      payload.toDate = enddate.toDate();
      payload.fromTime = moment(fromTime, "HH:mm").format("hh:mm A");
      payload.toTime = moment(toTime, "HH:mm").format("hh:mm A");
    }
    await LEAVE.create(payload);
    return successResponse(res, 201, "Leave request created");
  } catch (error) {
    next(error);
  }
};

//===================== LEAVE REQUEST HISTORY ============================
exports.getLeaveHistory = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    let { page = 1, limit = 10, year, filter } = req.query;
    const _where = { user: userId, isDeleted: false };
    const conditions = [];

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
        conditions.push({
          $or: [
            { $expr: { $eq: [{ $month: "$date" }, monthIndex + 1] } },
            { $expr: { $eq: [{ $month: "$fromDate" }, monthIndex + 1] } },
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

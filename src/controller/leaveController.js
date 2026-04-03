const moment = require("moment");
const { LEAVE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { getProjection } = require("../utils/projection");
const { LEAVE_DAY_TYPE, LEAVE_DURATION } = require("../utils/enum");

//======================= SEND LEAVE REQUEST =================================
exports.createLeaveRequest = async (req, res, next) => {
  try {
    const { _id: user } = req.user;
    const { reasonType, reason, numberOfDays, date, isFullDay, fromTime, toTime, fromDate, toDate, } = req.body;
    const payload = { user, reason, reasonType, numberOfDays };

    if (numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
      if (!date) throw new AppError("Date is required", 400);
      payload.date = new Date(date);
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
      if (toDate < fromDate) {
        throw new AppError("Invalid Date range", 400);
      }

      payload.fromDate = new Date(fromDate);
      payload.toDate = new Date(toDate);
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
      if (filter === LEAVE_DAY_TYPE.SINGLE) {
        conditions.push({
          numberOfDays: LEAVE_DAY_TYPE.SINGLE,
          isFullDay: true,
        });
      } else if (filter === LEAVE_DURATION.HALF) {
        conditions.push({
          numberOfDays: LEAVE_DAY_TYPE.SINGLE,
          isFullDay: false,
        });
      } else if (filter === LEAVE_DAY_TYPE.MULTIPLE) {
        conditions.push({
          numberOfDays: LEAVE_DAY_TYPE.MULTIPLE,
        });
      }

      const monthIndex = moment(filter, "MMMM", true).month();
      if (!isNaN(monthIndex)) {
        conditions.push({
          $or: [
            { $expr: { $eq: [{ $month: "$date" }, monthIndex + 1] } },
            { $expr: { $eq: [{ $month: "$fromDate" }, monthIndex + 1] } },
          ],
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

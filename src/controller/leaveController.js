const moment = require("moment");
const { LEAVE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { getProjection } = require("../utils/projection");

const {
  LEAVE_DAY_TYPE,
  LEAVE_DURATION,
  LEAVE_STATUS,
} = require("../utils/enum");

//======================= SEND LEAVE REQUEST =================================
exports.createLeaveRequest = async (req, res, next) => {
  try {
    const { _id: user } = req.user;

    const {
      reason,
      numberOfDays,
      date,
      fullHalfDay,
      fromTime,
      toTime,
      fromDateTime,
      toDateTime,
    } = req.body;

    const data = { user, reason, numberOfDays };

    // ---------- SINGLE DAY -------
    if (numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
      if (!date) throw new AppError("Date is required", 400);

      Object.assign(data, {
        date: new Date(date + "T00:00:00.000Z"),
        fullHalfDay,
      });

      if (fullHalfDay === LEAVE_DURATION.HALF) {
        if (!fromTime || !toTime) {
          throw new AppError("From Time and To Time required", 400);
        }

        data.fromTime = moment(fromTime, "HH:mm").format("hh:mm A");
        data.toTime = moment(toTime, "HH:mm").format("hh:mm A");
      }
    }

    // ========= MULTIPLE DAYS =========
    if (numberOfDays === LEAVE_DAY_TYPE.MULTIPLE) {
      if (!fromDateTime || !toDateTime) {
        throw new AppError("From and To date time required", 400);
      }

      const from = moment(fromDateTime);
      const to = moment(toDateTime);

      if (to.isBefore(from)) {
        throw new AppError("To date must be after From date", 400);
      }

      Object.assign(data, {
        fromDateTime: from.toDate(),
        toDateTime: to.toDate(),
      });
    }

    const leave = await LEAVE.create(data);

    return successResponse(res, 201, "Leave request created", leave);
  } catch (error) {
    next(error);
  }
};

//===================== LEAVE REQUEST HISTORY ============================
exports.getLeaveHistory = async (req, res, next) => {
  try {
    const { _id: user } = req.user;

    let { page = 1, limit = 10, year, filter } = req.query;

    const _where = { user, isDeleted: false };

    // --- year search ---
    if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);

      _where.$or = [
        { date: { $gte: start, $lte: end } },
        { fromDateTime: { $gte: start, $lte: end } },
      ];
    }

    // ----- other search ----
    if (filter) {
      // filter Single day and  Multiple day
      if (Object.values(LEAVE_DAY_TYPE).includes(filter)) {
        _where.numberOfDays = filter;
      }

      // filter Half Day
      if (filter === LEAVE_DURATION.HALF) {
        _where.fullHalfDay = LEAVE_DURATION.HALF;
      }

      // filter Month
      const monthIndex = moment().month(filter).month(); // "March" -> 2
      if (!isNaN(monthIndex)) {
        _where.$expr = {
          $eq: [{ $month: "$date" }, monthIndex + 1],
        };
      }
    }
    const projection = getProjection().replace("-createdAt", "");

    const { data, pagination } = await paginate({
      model: LEAVE,
      _where,
      page,
      limit,
      sort: { createdAt: -1 },
      select: projection,
    });

    let srNo = (page - 1) * limit + 1;
    data.forEach((item) => (item.srNo = srNo++));

    return successResponse(res, 200, "Leave history fetched", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const moment = require("moment");
const mongoose = require("mongoose");
const { ATTENDANCE, USER, HOLIDAY, LEAVE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const {
  TIMEZONES,
  LEAVE_DURATION,
  LEAVE_STATUS,
  ROLES,
} = require("../utils/enum");
const { paginate, paginateArray } = require("../utils/pagination");
const { parseTime } = require("../utils/timeFormat");
const {
  getDayRange,
  getMonthRange,
  formatDate,
  dateSearchQuery,
} = require("../utils/dateFormat");

//-------- calculate worked minutes , FULL DAY (No outTime) ------------
const calculateDayStats = (records) => {
  let workedMinutes = 0;
  let hasMissingOut = false;
  records.forEach((r) => {
    if (r.inTime && !r.outTime) {
      hasMissingOut = true;
    }
    if (r.inTime && r.outTime) {
      workedMinutes += parseTime(r.outTime) - parseTime(r.inTime);
    }
  });

  const requiredMinutes = records?.[0]?.totalMinutes || 0;
  return { workedMinutes, hasMissingOut, requiredMinutes };
};

//--------------- INSERT ATTENDANCE ------------------
exports.createAttendance = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { date, inTime, outTime, lateReason, leaveReason, overTimeReason } =
      req.body;

    const isUserExists = await USER.findOne({
      _id: userId,
      isDeleted: false,
    }).select("officeTiming attendanceType");
    if (!isUserExists) throw new AppError("User not found with given Id", 404);

    const { startOfDay, endOfDay } = getDayRange(date);
    const attendanceDate = startOfDay;

    // check attendance already exists
    const existingAttendance = await ATTENDANCE.find({
      userId,
      isDeleted: false,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).select("_id");

    // check leave request is approved or not
    const approvedLeave = await LEAVE.findOne({
      user: userId,
      isDeleted: false,
      isPMApproved: LEAVE_STATUS.APPROVED,
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        {
          fromDate: { $lte: endOfDay },
          toDate: { $gte: startOfDay },
        },
      ],
    });
    if (existingAttendance && !approvedLeave) {
      throw new AppError("Attendance already exists for this date", 409);
    }

    const inMin = parseTime(inTime);
    const officeIn = parseTime(isUserExists.officeTiming.entryTime);
    const lateEntryLimit = parseTime(
      isUserExists.officeTiming.lateEntryAfterMinutes,
    );

    // if enter early
    if (inMin < officeIn) {
      throw new AppError("You are coming early from Your Time", 400);
    }
    // if late - late reason required
    if (inMin > lateEntryLimit && !lateReason) {
      throw new AppError("Late reason required", 400);
    }

    if (outTime) {
      const outMin = parseTime(outTime);
      const totalWorked = outMin - inMin;
      const requiredMinutes = isUserExists.officeTiming.totalMinutes;
      // if early out - leave reason required
      if (totalWorked < requiredMinutes && !leaveReason) {
        throw new AppError("Leave reason required", 400);
      }
      // if over time - over time reason required
      if (totalWorked > requiredMinutes && !overTimeReason) {
        throw new AppError("Overtime reason required", 400);
      }
    }

    const getFilePath = (file) =>
      file ? `/uploads/attendance/${file.filename}` : "";
    const entryImage = getFilePath(req.files?.entry?.[0]);
    const exitImage = getFilePath(req.files?.exit?.[0]);

    const payload = {
      userId,
      date: attendanceDate,
      mode: isUserExists.attendanceType,
      totalMinutes: isUserExists.officeTiming.totalMinutes,
      officeEntryTime: isUserExists.officeTiming.entryTime,
      officeExitTime: isUserExists.officeTiming.exitTime,
      lateEntryAfterMinutes: isUserExists.officeTiming.lateEntryAfterMinutes,
      entry: entryImage,
      exit: exitImage,
      createdBy: userId,
      ...req.body,
    };

    await ATTENDANCE.create(payload);
    return successResponse(res, 200, "Attendance created successfully");
  } catch (err) {
    next(err);
  }
};

//------------- DISPLAY ATTENDANCE ------------------------
exports.getAttendance = async (req, res, next) => {
  try {
    let { page, limit, month, year, search, userId: queryUserId } = req.query;
    const { _id: loggedInUserId, role } = req.user;

    const now = moment.tz(TIMEZONES.INDIA);
    const selectedMonth = month ? Number(month) : now.month() + 1;
    const selectedYear = year ? Number(year) : now.year();

    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );

    const userId =
      role === ROLES.ADMIN && queryUserId ? queryUserId : loggedInUserId;

    const _where = {
      userId,
      isDeleted: false,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    };

    if (search) {
      const dateQuery = dateSearchQuery("date", search);
      if (dateQuery) {
        _where.date = dateQuery.date;
      }
    }

    const { data, pagination } = await paginate({
      model: ATTENDANCE,
      query: _where,
      page,
      limit,
      sort: { date: -1 },
      populate: [
        {
          path: "createdBy",
          select: "name",
          match: { isDeleted: false },
          options: { lean: true },
        },
      ],
    });

    const [attendanceData, holidays, leaves] = await Promise.all([
      ATTENDANCE.find(_where).lean(),
      HOLIDAY.find({
        isDeleted: false,
        holidayDate: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean(),
      LEAVE.find({
        user: userId,
        isDeleted: false,
        isPMApproved: LEAVE_STATUS.APPROVED,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean(),
    ]);

    const holidaySet = new Set(holidays.map((h) => formatDate(h.holidayDate)));
    const leaveSet = new Set(leaves.map((l) => formatDate(l.date)));
    const attendanceMap = new Map();
    attendanceData.forEach((a) => {
      const key = formatDate(a.date);
      if (!attendanceMap.has(key)) attendanceMap.set(key, []);
      attendanceMap.get(key).push(a);
    });

    let summary = {
      totalPresentDays: 0,
      totalDeductedMinutes: 0,
      totalAdditionalMinutes: 0,
      totalUsedCounter: 0,
      totalFullDayLeave: 0,
      totalLateEntryDeduction: 0,
    };

    // Holiday and Leave
    let current = moment(startOfMonth);
    while (current.toDate() <= endOfMonth) {
      const key = formatDate(current.toDate());
      const isSunday = current.day() === 0;
      const isHoliday = holidaySet.has(key);
      const records = attendanceMap.get(key);
      const hasLeave = leaveSet.has(key);

      if ((isSunday || isHoliday) && !records) {
        current.add(1, "day");
        continue;
      }

      // no attendance = full leave
      if (!records) {
        summary.totalFullDayLeave++;
        current.add(1, "day");
        continue;
      }

      //calculate worked minutes and FULLDAY if any record has inTime but no outTime
      const {
        workedMinutes: worked,
        hasMissingOut,
        requiredMinutes: required,
      } = calculateDayStats(records);

      if (hasMissingOut && !hasLeave) {
        summary.totalFullDayLeave++;
        summary.totalDeductedMinutes += required;
        current.add(1, "day");
        continue;
      }

      if (worked) {
        summary.totalPresentDays++;
      }
      let dayCounter = records.some((r) => r.usedCounter === 1) ? 1 : 0;
      // ignore counter if leave approved
      if (hasLeave) {
        dayCounter = 0;
      }
      summary.totalUsedCounter += dayCounter;

      // overtime and deduction
      if (worked > required) {
        summary.totalAdditionalMinutes += worked - required;
      } else if (worked < required) {
        summary.totalDeductedMinutes += required - worked;
      }
      current.add(1, "day");
    }

    // late penalty
    if (summary.totalUsedCounter >= 4) {
      summary.totalLateEntryDeduction = 180;
      summary.totalDeductedMinutes += 180;
    }

    return successResponse(res, 200, "Attendance fetched successfully", {
      data,
      pagination,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

//================ attendance leave history ======================
exports.getAttendanceHistory = async (req, res, next) => {
  try {
    let { page, limit, month, year, search } = req.query;
    const { _id: userId } = req.user;

    const now = moment.tz(TIMEZONES.INDIA).subtract(1, "day");
    const selectedMonth = month ? Number(month) : now.month() + 1;
    const selectedYear = year ? Number(year) : now.year();

    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );

    const loopEnd = endOfMonth > now.toDate() ? now.toDate() : endOfMonth;

    const [attendanceData, holidays] = await Promise.all([
      ATTENDANCE.find({
        userId,
        isDeleted: false,
        date: { $gte: startOfMonth, $lte: loopEnd },
      }).lean(),
      HOLIDAY.find({
        isDeleted: false,
        holidayDate: { $gte: startOfMonth, $lte: loopEnd },
      }).lean(),
    ]);

    const holidaySet = new Set(holidays.map((h) => formatDate(h.holidayDate)));

    // group by date
    const attendanceMap = new Map();
    attendanceData.forEach((a) => {
      const key = formatDate(a.date);
      if (!attendanceMap.has(key)) attendanceMap.set(key, []);
      attendanceMap.get(key).push(a);
    });

    let result = [];

    let current = moment(startOfMonth);
    while (current.toDate() <= loopEnd) {
      const key = formatDate(current.toDate());
      const isSunday = current.day() === 0;
      const isHoliday = holidaySet.has(key);

      // if sunday and holiday - skip
      if (isSunday || isHoliday) {
        current.add(1, "day");
        continue;
      }

      const record = attendanceMap.get(key);

      //no attendance → FULL day leave
      if (!record) {
        result.push({
          date: key,
          leaveDay: LEAVE_DURATION.FULL,
          leaveStatus: "-",
        });
        current.add(1, "day");
        continue;
      }

      const { workedMinutes, hasMissingOut, requiredMinutes } =
        calculateDayStats(record);

      // FULL DAY
      if (hasMissingOut) {
        result.push({
          date: key,
          leaveDay: LEAVE_DURATION.FULL,
          leaveStatus: "-",
        });
        current.add(1, "day");
        continue;
      }

      // HALF DAY
      if (workedMinutes < requiredMinutes) {
        const diff = requiredMinutes - workedMinutes;
        result.push({
          date: key,
          leaveDay: LEAVE_DURATION.HALF,
          leaveStatus: `${diff} minutes early`,
        });
      }
      current.add(1, "day");
    }

    //search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((item) => {
        return (
          item.date.includes(s) ||
          item.leaveDay?.toLowerCase().includes(s) ||
          item.leaveStatus?.toLowerCase().includes(s)
        );
      });
    }

    const { data, pagination } = paginateArray(result, page, limit);
    return successResponse(res, 200, "Leave history fetched successfully", {
      data,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

const moment = require("moment");
const mongoose = require("mongoose");
const { ATTENDANCE, USER, HOLIDAY } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { TIMEZONES, LEAVE_DURATION } = require("../utils/enum");
const { paginate } = require("../utils/pagination");

const parseTime = (time) => {
  if (!time) return 0;
  const [t, mod] = time.split(" ");
  let [h, m] = t.split(":").map(Number);
  if (mod === "PM" && h !== 12) h += 12;
  if (mod === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

//--------------- INSERT ATTENDANCE ------------------
exports.createAttendance = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { date, inTime, outTime, lateReason, leaveReason, overTimeReason } =
      req.body;

    const isUserExists = await USER.findById(userId).select(
      "officeTiming attendanceType",
    );
    if (!isUserExists) throw new AppError("User not found with given Id", 404);

    const attendanceDate = moment
      .tz(date, "YYYY-MM-DD", TIMEZONES.INDIA)
      .startOf("day")
      .toDate();

    // const isAttendanceExists = await ATTENDANCE.findOne({
    //   userId,
    //   date: attendanceDate,
    //   isDeleted: false,
    // });
    // if (isAttendanceExists)
    //   throw new AppError("Attendance already exists for this date", 400);

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
    let { page = 1, limit = 10, month, year } = req.query;
    const { _id: userId } = req.user;

    const currentDate = moment();
    const selectedMonth = month ? Number(month) - 1 : currentDate.month();
    const selectedYear = year ? Number(year) : currentDate.year();

    const startDate = moment()
      .year(selectedYear)
      .month(selectedMonth)
      .startOf("month")
      .toDate();
    const endDate = moment()
      .year(selectedYear)
      .month(selectedMonth)
      .endOf("month")
      .toDate();

    const _where = {
      userId,
      isDeleted: false,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

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
        },
      ],
    });

    const stats = await ATTENDANCE.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: userId,
          totalPresentDays: {
            $sum: {
              $cond: [{ $and: ["$inTime", "$outTime"] }, 1, 0],
            },
          },
          totalDeductedMinutes: { $sum: "$deductedMinutes" },
          totalAdditionalMinutes: { $sum: "$overTime" },
          totalUsedCounter: { $sum: "$usedCounter" },
          totalFullDayLeave: {
            $sum: {
              $cond: [{ $eq: ["$leaveDay", "Full Day"] }, 1, 0],
            },
          },
          totalPermittedMinutes: { $sum: "$permittedMinutes" },
        },
      },
    ]);

    let summary = stats[0] || {
      totalPresentDays: 0,
      totalDeductedMinutes: 0,
      totalAdditionalMinutes: 0,
      totalUsedCounter: 0,
      totalFullDayLeave: 0,
      totalPermittedMinutes: 0,
    };

    // late entry
    summary.totalLateEntryDeduction = summary.totalUsedCounter >= 4 ? 180 : 0;

    return successResponse(res, 200, "Attendance fetched successfully", {
      data,
      pagination,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/*
//------------- DISPLAY ATTENDANCE ------------------------
exports.getAttendance = async (req, res, next) => {
  try {
    let { page, limit, month, year } = req.query;
    const { _id: userId } = req.user;

    const isUserExists = await USER.findById(userId).select("officeTiming");
    if (!isUserExists) throw new AppError("User not found with given Id", 404);

    const requiredMinutes = isUserExists.officeTiming.totalMinutes;

    const now           = moment.utc().subtract(1, "day").endOf("day");
    const selectedMonth = month ? Number(month) - 1 : now.month(); // 0-indexed
    const selectedYear  = year  ? Number(year)      : now.year();

    const startDate = moment.utc()
      .year(selectedYear).month(selectedMonth).startOf("month");
    const endDate   = moment.utc()
      .year(selectedYear).month(selectedMonth).endOf("month");

    const [attendanceRecords, holidays] = await Promise.all([
      ATTENDANCE.find({
        userId,
        isDeleted: false,
        date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      })
        .populate({ path: "createdBy", select: "name" })
        .lean(),

      HOLIDAY.find({
        holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        isDeleted: false,
      }).lean(),
    ]);

    const holidaySet = new Set(
      holidays.map((h) => moment.utc(h.holidayDate).format("YYYY-MM-DD"))
    );

    const attendanceMap = new Map(); // "YYYY-MM-DD" → [rec, ...]
    for (const rec of attendanceRecords) {
      const key = moment.utc(rec.date).format("YYYY-MM-DD");
      if (!attendanceMap.has(key)) attendanceMap.set(key, []);
      attendanceMap.get(key).push(rec);
    }

    const finalData       = [];
    let totalFullDayLeave = 0;
    let totalPresentDays  = 0;

    const loopEnd    = endDate.isAfter(now) ? now.clone() : endDate.clone();
    let   currentDay = startDate.clone();

    while (currentDay.isSameOrBefore(loopEnd, "day")) {
      const dateStr  = currentDay.format("YYYY-MM-DD");
      const isSunday = currentDay.day() === 0;

      // skip Sundays and holidays 
      if (isSunday || holidaySet.has(dateStr)) {
        currentDay.add(1, "day");
        continue;
      }
      const dayRecords = attendanceMap.get(dateStr) || [];

      if (dayRecords.length === 0) {
        finalData.push({
          date:                  currentDay.toDate(),
          attendances:           [],
          totalTime:             0,
          totalDeductedMinutes:  0,
          totalOverTime:         0,
          totalPermittedMinutes: 0,
          totalUsedCounter:      0,
          leaveDay:              LEAVE_DURATION.FULL,
          leaveStatus:           "-",
          status:                "Leave",
        });
        totalFullDayLeave++;
        currentDay.add(1, "day");
        continue;
      }

      let totalTime             = 0;
      let totalDeductedMinutes  = 0;
      let totalPermittedMinutes = 0;
      let totalUsedCounter      = 0;
      let totalOverTime         = 0;

      for (const rec of dayRecords) {
        totalTime             += rec.totalTime        || 0;
        totalDeductedMinutes  += rec.deductedMinutes  || 0;
        totalPermittedMinutes += rec.permittedMinutes || 0;
        totalUsedCounter      += rec.usedCounter      || 0;
        totalOverTime         += rec.overTime         || 0;
      }

      if (totalDeductedMinutes > requiredMinutes) {
        totalDeductedMinutes = requiredMinutes;
      }

      const isPresent = totalTime >= requiredMinutes;
      const isHalfDay = !isPresent && totalTime >= Math.floor(requiredMinutes / 2);

      let leaveDay, leaveStatus, status;

      if (isPresent) {
        totalPresentDays++;
        leaveDay             = LEAVE_DURATION.NONE;
        leaveStatus          = "-";
        status               = "Present";
        totalDeductedMinutes = 0; 
      } else if (isHalfDay) {
        leaveDay      = LEAVE_DURATION.HALF;
        leaveStatus   = `${requiredMinutes - totalTime} minutes early`;
        status        = "Half Day Leave";
        totalOverTime = 0; 
      } else {
        // worked less than half a day, or inTime only (no outTime)
        totalFullDayLeave++;
        leaveDay             = LEAVE_DURATION.FULL;
        leaveStatus          = "-";
        status               = "Leave";
        totalDeductedMinutes = 0;
        totalOverTime        = 0;
      }

      finalData.push({
        date:                  currentDay.toDate(),
        attendances:           dayRecords,
        totalTime,
        totalDeductedMinutes,
        totalOverTime,
        totalPermittedMinutes,
        totalUsedCounter,
        leaveDay,
        leaveStatus,
        status,
      });

      currentDay.add(1, "day");
    }
    finalData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // ── Summary
    const sumDeducted    = finalData.reduce((s, d) => s + d.totalDeductedMinutes,  0);
    const sumOverTime    = finalData.reduce((s, d) => s + d.totalOverTime,          0);
    const sumPermitted   = finalData.reduce((s, d) => s + d.totalPermittedMinutes,  0);
    const sumUsedCounter = finalData.reduce((s, d) => s + d.totalUsedCounter,       0);

    const totalLateEntryDeduction = sumUsedCounter >= 4 ? 180 : 0;

    const summary = {
      totalPresentDays,
      totalFullDayLeave,
      totalDeductedMinutes:   sumDeducted + totalLateEntryDeduction,
      totalAdditionalMinutes: sumOverTime,
      totalPermittedMinutes:  sumPermitted,
      totalUsedCounter:       sumUsedCounter,
      totalLateEntryDeduction,
    };

    return successResponse(res, 200, "Attendance fetched successfully", {
      data: finalData,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

*/

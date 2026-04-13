const moment = require("moment");
const mongoose = require("mongoose");
const { ATTENDANCE, USER } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { TIMEZONES } = require("../utils/enum");
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
    if (!isUserExists) throw new AppError("User not found", 404);

    const attendanceDate = moment
      .tz(date, "YYYY-MM-DD", TIMEZONES.ASIA_KOLKATA)
      .startOf("day")
      .toDate();

    const isAttendanceExists = await ATTENDANCE.findOne({
      userId,
      date: attendanceDate,
      isDeleted: false,
    });
    if (isAttendanceExists)
      throw new AppError("Attendance already exists for this date", 400);

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

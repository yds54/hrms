const moment = require("moment");
const mongoose = require("mongoose");
const { ATTENDANCE, USER, HOLIDAY, LEAVE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { getFileUrl } = require("../utils/fileUrl");
const { successResponse } = require("../utils/sucess");
const { createLog } = require("../utils/createLog");
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

const {
  uploadToCloudinary,
  cleanupMultipleLocalFiles,
  deleteMultipleFromCloudinary,
} = require("../utils/cloudinaryHelper");

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
  const uploadedPublicIds = [];

  try {
    let userId = req.user._id;

    if ([ROLES.ADMIN, ROLES.HR].includes(req.user.role) && req.body.userId) {
      userId = req.body.userId;
    }

    const {
      date,
      fromDate,
      toDate,
      inTime,
      outTime,
      lateReason,
      leaveReason,
      overTimeReason,
    } = req.body;

    const isUserExists = await USER.findOne({
      _id: userId,
      isDeleted: false,
    }).select("officeTiming attendanceType");

    if (!isUserExists) {
      throw new AppError("User not found with given Id", 404);
    }

    const inMin = parseTime(inTime);
    const officeIn = parseTime(isUserExists.officeTiming.entryTime);
    const lateEntryLimit = parseTime(
      isUserExists.officeTiming.lateEntryAfterMinutes,
    );

    if (inMin < officeIn) {
      throw new AppError("You are coming early from Your Time", 400);
    }

    if (inMin > lateEntryLimit && !lateReason) {
      throw new AppError("Late reason required", 400);
    }

    if (outTime) {
      const outMin = parseTime(outTime);
      const totalWorked = outMin - inMin;
      const requiredMinutes = isUserExists.officeTiming.totalMinutes;

      if (totalWorked < requiredMinutes && !leaveReason) {
        throw new AppError("Leave reason required", 400);
      }

      if (totalWorked > requiredMinutes && !overTimeReason) {
        throw new AppError("Overtime reason required", 400);
      }
    }

    let entryImage = null;
    let exitImage = null;

    if (req.files?.entry?.[0]) {
      const uploadedEntry = await uploadToCloudinary(req.files.entry[0], {
        folder: "attendance",
        useUserFolder: true,
        userId,
      });

      uploadedPublicIds.push(uploadedEntry.publicId);

      entryImage = {
        fileName: uploadedEntry.fileName,
        fileType: uploadedEntry.fileType,
        size: uploadedEntry.size,
      };
    }

    if (req.files?.exit?.[0]) {
      const uploadedExit = await uploadToCloudinary(req.files.exit[0], {
        folder: "attendance",
        useUserFolder: true,
        userId,
      });

      uploadedPublicIds.push(uploadedExit.publicId);

      exitImage = {
        fileName: uploadedExit.fileName,
        fileType: uploadedExit.fileType,
        size: uploadedExit.size,
      };
    }

    const dates = [];

    if (fromDate && toDate) {
      let currentDate = moment(fromDate).startOf("day");
      const endDate = moment(toDate).startOf("day");

      while (currentDate.isSameOrBefore(endDate)) {
        dates.push(currentDate.toDate());
        currentDate.add(1, "day");
      }
    } else {
      dates.push(new Date(date));
    }

    const attendancePayloads = [];

    const { userId: bodyUserId, ...attendanceBody } = req.body;

    for (const currentDate of dates) {
      if (moment(currentDate).day() === 0) {
        continue;
      }

      const { startOfDay, endOfDay } = getDayRange(currentDate);
      const attendanceDate = startOfDay;

      const existingAttendance = await ATTENDANCE.findOne({
        userId,
        isDeleted: false,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).select("_id");

      const approvedLeave = await LEAVE.findOne({
        user: userId,
        isDeleted: false,
        isPMApproved: LEAVE_STATUS.APPROVED,
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
      });

      if (existingAttendance && !approvedLeave) {
        continue;
      }

      attendancePayloads.push({
        userId,
        date: attendanceDate,
        mode: isUserExists.attendanceType,
        totalMinutes: isUserExists.officeTiming.totalMinutes,
        officeEntryTime: isUserExists.officeTiming.entryTime,
        officeExitTime: isUserExists.officeTiming.exitTime,
        lateEntryAfterMinutes: isUserExists.officeTiming.lateEntryAfterMinutes,
        entry: entryImage,
        exit: exitImage,
        createdBy: req.user._id,
        ...attendanceBody,
      });
    }

    if (!attendancePayloads.length) {
      throw new AppError(
        "Attendance already exists for all selected dates or all dates are Sundays",
        409,
      );
    }

    await ATTENDANCE.insertMany(attendancePayloads);
    return successResponse(res, 200, "Attendance created successfully");
  } catch (error) {
    await deleteMultipleFromCloudinary(uploadedPublicIds);

    cleanupMultipleLocalFiles(req.files);

    next(error);
  }
};

//------------- DISPLAY ATTENDANCE ------------------------
exports.getAttendance = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      month,
      year,
      search,
      date,
      gender,
      attendanceType,
      organizationId,
      overtime,
      userId: queryUserId,
    } = req.query;

    const { _id: loggedInUserId, role } = req.user;

    if (role === ROLES.ADMIN && !queryUserId) {
      const selectedDate = date
        ? moment.tz(date, TIMEZONES.INDIA)
        : moment.tz(TIMEZONES.INDIA);

      const _where = {
        isDeleted: false,
        date: {
          $gte: selectedDate.clone().startOf("day").toDate(),
          $lte: selectedDate.clone().endOf("day").toDate(),
        },
      };

      if (overtime !== undefined) {
        _where.isOvertime = overtime === "true";
      }

      const { data, pagination } = await paginate({
        model: ATTENDANCE,
        query: _where,
        page,
        limit,
        sort: { date: -1 },
        populate: [
          {
            path: "userId",
            select:
              "fullName employeeCode email contactNumber profilePicture gender attendanceType organizationId",
            match: {
              isDeleted: false,
              ...(gender ? { gender } : {}),
              ...(attendanceType ? { attendanceType } : {}),
              ...(organizationId ? { organizationId } : {}),
            },
            options: { lean: true },
          },
          {
            path: "createdBy",
            select: "name",
            match: {
              isDeleted: false,
            },
            options: { lean: true },
          },
        ],
      });

      const formattedData = data.map((item) => {
        if (item.userId?.profilePicture?.fileName) {
          item.userId.profilePicture.url = getFileUrl(
            `profile/${item.userId.profilePicture.fileName}`,
          );
        }

        if (item.entry?.fileName) {
          item.entry.url = getFileUrl(
            `attendance/${item.userId?._id}/${item.entry.fileName}`,
          );
        }

        if (item.exit?.fileName) {
          item.exit.url = getFileUrl(
            `attendance/${item.userId?._id}/${item.exit.fileName}`,
          );
        }

        return item;
      });

      const filteredData = formattedData.filter(
        (attendance) => attendance.userId,
      );

      return successResponse(res, 200, "Attendance fetched successfully", {
        selectedDate: selectedDate.format("YYYY-MM-DD"),
        data: filteredData,
        pagination,
      });
    }

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
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
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
          match: {
            isDeleted: false,
          },
          options: {
            lean: true,
          },
        },
      ],
    });

    const formattedData = data.map((item) => {
      const attendance = item.toObject ? item.toObject() : item;

      if (attendance.entry?.fileName) {
        attendance.entry.url = getFileUrl(
          `attendance/${attendance.userId}/${attendance.entry.fileName}`,
        );
      }

      if (attendance.exit?.fileName) {
        attendance.exit.url = getFileUrl(
          `attendance/${attendance.userId}/${attendance.exit.fileName}`,
        );
      }

      return attendance;
    });

    const [attendanceData, holidays, leaves] = await Promise.all([
      ATTENDANCE.find(_where).lean(),

      HOLIDAY.find({
        isDeleted: false,
        holidayDate: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      }).lean(),

      LEAVE.find({
        user: userId,
        isDeleted: false,
        isPMApproved: LEAVE_STATUS.APPROVED,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      }).lean(),
    ]);

    const holidaySet = new Set(
      holidays.map((holiday) => formatDate(holiday.holidayDate)),
    );

    const leaveSet = new Set(leaves.map((leave) => formatDate(leave.date)));

    const attendanceMap = new Map();

    attendanceData.forEach((attendance) => {
      const key = formatDate(attendance.date);

      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, []);
      }

      attendanceMap.get(key).push(attendance);
    });

    const summary = {
      totalPresentDays: 0,
      totalDeductedMinutes: 0,
      totalAdditionalMinutes: 0,
      totalUsedCounter: 0,
      totalFullDayLeave: 0,
      totalLateEntryDeduction: 0,
    };

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

      if (!records) {
        summary.totalFullDayLeave++;
        current.add(1, "day");
        continue;
      }

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

      let dayCounter = records.some((record) => record.usedCounter === 1)
        ? 1
        : 0;

      if (hasLeave) {
        dayCounter = 0;
      }

      summary.totalUsedCounter += dayCounter;

      if (worked > required) {
        summary.totalAdditionalMinutes += worked - required;
      } else if (worked < required) {
        summary.totalDeductedMinutes += required - worked;
      }

      current.add(1, "day");
    }

    if (summary.totalUsedCounter >= 4) {
      summary.totalLateEntryDeduction = 180;
      summary.totalDeductedMinutes += 180;
    }

    return successResponse(res, 200, "Attendance fetched successfully", {
      data: formattedData,
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

exports.updateAttendance = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isAttendanceExists = await ATTENDANCE.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!isAttendanceExists) {
      throw new AppError("Attendance not found for given ID", 404);
    }

    const user = await USER.findOne({
      _id: isAttendanceExists.userId,
      isDeleted: false,
    })
      .select("officeTiming")
      .lean();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const inMin = parseTime(payload.inTime);
    const officeIn = parseTime(user.officeTiming.entryTime);

    let outMin;
    let totalWorked = 0;
    let isOverTime = false;

    if (payload.outTime) {
      outMin = parseTime(payload.outTime);

      const requiredMinutes = user.officeTiming.totalMinutes;

      totalWorked = outMin - inMin + Number(payload.extraMinutes || 0);

      if (totalWorked > requiredMinutes) {
        isOverTime = true;
      }
    }

    await ATTENDANCE.updateOne(
      { _id: id, isDeleted: false },
      {
        $set: {
          ...payload,
          totalTime: totalWorked,
          isOverTime,
        },
      },
    );

    const updatedAttendance = await ATTENDANCE.findById(id).lean();

    await createLog({
      userId: req.user._id,
      tableName: "attendance",
      recordId: id,
      action: "UPDATE",
      oldRecord: isAttendanceExists,
      newRecord: updatedAttendance,
    });

    return successResponse(res, 200, "Attendance updated successfully", {
      data: updatedAttendance,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAttendanceExists = await ATTENDANCE.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isAttendanceExists) {
      throw new AppError("Attendance not found", 404);
    }

    const oldAttendance = isAttendanceExists.toObject();

    isAttendanceExists.isDeleted = true;
    isAttendanceExists.deletedAt = moment().toDate();

    await isAttendanceExists.save();

    await createLog({
      userId: req.user._id,
      tableName: "attendance",
      recordId: isAttendanceExists._id,
      action: "DELETE",
      oldRecord: oldAttendance,
    });

    return successResponse(res, 200, "Attendance deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { selectedDate, page, limit } = req.query;

    if (!selectedDate) {
      throw new AppError("selectedDate is required", 400);
    }

    const [year, month] = selectedDate.split("-").map(Number);

    const startDate = moment
      .tz(`${year}-${String(month).padStart(2, "0")}-01`, TIMEZONES.INDIA)
      .startOf("month")
      .toDate();

    const endDate = moment(startDate).endOf("month").toDate();

    const totalDaysOfMonth = moment(startDate).daysInMonth();

    const employeePipeline = [
      {
        $match: {
          isDeleted: false,
          isLeft: false,
        },
      },
      {
        $project: {
          employeeCode: 1,
          name: 1,
          profilePicture: 1,
        },
      },
    ];

    const { data: employees, pagination } = await paginate({
      model: USER,
      pipeline: employeePipeline,
      page: +page,
      limit: +limit,
      sort: {
        "name.firstName": 1,
      },
    });

    const employeeIds = employees.map((emp) => emp._id);

    const [attendances, monthHolidays] = await Promise.all([
      ATTENDANCE.find({
        userId: {
          $in: employeeIds,
        },
        isDeleted: false,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .select(
          "userId date inTime outTime totalTime overTime isOverTime totalMinutes mode createdAt",
        )
        .sort({ date: 1 })
        .lean(),

      HOLIDAY.find({
        isDeleted: false,
        holidayDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .select("holidayName holidayDate -_id")
        .lean(),
    ]);

    const attendanceMap = new Map();

    attendances.forEach((attendance) => {
      const key = attendance.userId.toString();

      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, []);
      }

      attendanceMap.get(key).push({
        date: moment(attendance.date).format("YYYY-MM-DD"),
        inTime: attendance.inTime,
        outTime: attendance.outTime,
        totalTime: attendance.totalTime,
        overTime: attendance.overTime,
        overtimeCheckout: attendance.isOverTime,
        attendanceType: attendance.mode,
        totalMinutes: attendance.totalMinutes,
        createdAt: attendance.createdAt,
      });
    });

    const employeeAttendance = employees.map((employee) => {
      if (employee.profilePicture?.fileName) {
        employee.profilePicture.url = getFileUrl(
          `profile/${employee.profilePicture.fileName}`,
        );
      }

      return {
        employee: {
          _id: employee._id,
          employeeCode: employee.employeeCode,
          firstName: employee.name?.firstName,
          middleName: employee.name?.middleName,
          lastName: employee.name?.lastName,
          profilePicture: employee.profilePicture,
        },
        attendance: attendanceMap.get(employee._id.toString()) || [],
      };
    });

    const monthSundays = [];

    let currentDate = moment(startDate);

    while (currentDate.isSameOrBefore(endDate, "day")) {
      if (currentDate.day() === 0) {
        monthSundays.push(currentDate.format("YYYY-MM-DD"));
      }

      currentDate.add(1, "day");
    }

    return successResponse(res, 200, "Attendance report fetched successfully", {
      totalDaysOfMonth,

      employees: employeeAttendance,

      monthHolidays: monthHolidays.map((holiday) => ({
        holidayName: holiday.holidayName,
        holidayDate: moment(holiday.holidayDate).format("YYYY-MM-DD"),
      })),

      monthSundays,

      startOfMonth: moment(startDate).format("YYYY-MM-DD"),

      endOfMonth: moment(endDate).format("YYYY-MM-DD"),

      pagination: {
        ...pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSandwichLeaveReport = async (req, res, next) => {
  try {
    const { selectedDate, userId, page, limit, search } = req.query;

    if (!selectedDate) {
      throw new AppError("selectedDate is required", 400);
    }

    const [year, month] = selectedDate.split("-").map(Number);

    const startOfMonth = moment
      .tz(`${year}-${String(month).padStart(2, "0")}-01`, TIMEZONES.INDIA)
      .startOf("month")
      .toDate();

    const endOfMonth = moment(startOfMonth)
      .tz(TIMEZONES.INDIA)
      .endOf("month")
      .toDate();

    const userFilter = {
      isDeleted: false,
    };

    if (userId && userId !== "all") {
      userFilter._id = userId;
    }

    if (search) {
      userFilter.fullName = {
        $regex: search.trim(),
        $options: "i",
      };
    }
    const [holidays, leaves, users] = await Promise.all([
      HOLIDAY.find({
        isDeleted: false,
        holidayDate: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      }).lean(),

      LEAVE.find({
        ...(userId && userId !== "all" ? { user: userId } : {}),
        isDeleted: false,
        isPMApproved: LEAVE_STATUS.APPROVED,
        $or: [
          {
            date: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          },
          {
            fromDate: {
              $lte: endOfMonth,
            },
            toDate: {
              $gte: startOfMonth,
            },
          },
        ],
      }).lean(),

      USER.find(userFilter).select("fullName leftDate isLeft createdAt").lean(),
    ]);

    const nonWorkingDays = new Set();

    holidays.forEach((holiday) => {
      nonWorkingDays.add(
        moment.tz(holiday.holidayDate, TIMEZONES.INDIA).date(),
      );
    });

    let current = moment.tz(startOfMonth, TIMEZONES.INDIA).startOf("day");

    while (
      current.isSameOrBefore(moment.tz(endOfMonth, TIMEZONES.INDIA), "day")
    ) {
      if (current.day() === 0) {
        nonWorkingDays.add(current.date());
      }

      current.add(1, "day");
    }

    const sortedNonWorkingDays = [...nonWorkingDays].sort((a, b) => a - b);

    const holidayBlocks = [];
    let block = [];

    for (const day of sortedNonWorkingDays) {
      if (block.length === 0 || day === block[block.length - 1] + 1) {
        block.push(day);
      } else {
        holidayBlocks.push(block);
        block = [day];
      }
    }

    if (block.length) {
      holidayBlocks.push(block);
    }

    const leaveMap = new Map();

    leaves.forEach((leave) => {
      const leaveUserId = leave.user.toString();

      if (!leaveMap.has(leaveUserId)) {
        leaveMap.set(leaveUserId, new Set());
      }

      const leaveDays = leaveMap.get(leaveUserId);

      if (leave.date) {
        leaveDays.add(moment.tz(leave.date, TIMEZONES.INDIA).date());
      }

      if (leave.fromDate && leave.toDate) {
        let currentDate = moment
          .tz(leave.fromDate, TIMEZONES.INDIA)
          .startOf("day");

        const leaveEndDate = moment
          .tz(leave.toDate, TIMEZONES.INDIA)
          .startOf("day");

        while (currentDate.isSameOrBefore(leaveEndDate, "day")) {
          leaveDays.add(currentDate.date());
          currentDate.add(1, "day");
        }
      }
    });

    const response = [];

    users.forEach((user) => {
      const leaveDays = leaveMap.get(user._id.toString()) || new Set();

      holidayBlocks.forEach((holidayBlock) => {
        const previousDay = holidayBlock[0] - 1;
        const nextDay = holidayBlock[holidayBlock.length - 1] + 1;

        if (leaveDays.has(previousDay) && leaveDays.has(nextDay)) {
          response.push({
            holidays: holidayBlock,
            leaves: [previousDay, nextDay],
            user: {
              leftDate: user.leftDate,
              isLeft: user.isLeft,
              _id: user._id,
              name: user.fullName,
              createdAt: user.createdAt,
            },
          });
        }
      });
    });

    const paginatedResult = paginateArray(response, +page, +limit);

    return successResponse(
      res,
      200,
      "Sandwich leave report fetched successfully",
      {
        data: paginatedResult.data,
        pagination: paginatedResult.pagination,
      },
    );
  } catch (error) {
    next(error);
  }
};

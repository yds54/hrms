const moment = require("moment-timezone");
const { DRS, HOLIDAY } = require("../model/modelIndex");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { AppError } = require("../utils/error");
const { getProjection } = require("../utils/projection");
const { TIMEZONES } = require("../utils/enum");
const {
  getDayRange,
  getMonthRange,
  dateSearchQuery,
  formatDate,
} = require("../utils/dateFormat");

//======================= ADD DRS =================================
exports.addDrs = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { date, onLeave, done, inProgress } = req.body;

    const { startOfDay } = getDayRange(date);

    const isDrsExists = await DRS.findOne({
      user: userId,
      date: startOfDay,
    }).select("_id");

    if (isDrsExists) {
      throw new AppError("DRS already submitted for this date", 409);
    }

    if (!onLeave && !(done || inProgress)) {
      throw new AppError("Either 'done' or 'inProgress' is required", 400);
    }

    const drs = await DRS.create({
      ...req.body,
      date: startOfDay,
      user: userId,
      createdBy: userId,
      updatedBy: userId,
    });

    return successResponse(res, 201, "DRS added successfully", drs);
  } catch (error) {
    next(error);
  }
};

//========================= SHOW DRS ===============================
exports.getDrs = async (req, res, next) => {
  try {
    let { page, limit, month, year, search } = req.query;
    const { _id: userId } = req.user;

    const currentDate = new Date();

    const selectedMonth = month ? Number(month) : currentDate.getMonth();
    const selectedYear = year ? Number(year) : currentDate.getFullYear();

    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );

    const _where = {
      user: userId,
      isDeleted: false,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    };

    // search
    if (search) {
      const searchConditions = [
        { notes: { $regex: search, $options: "i" } },
        { done: { $regex: search, $options: "i" } },
        { inProgress: { $regex: search, $options: "i" } },
        { nextPlan: { $regex: search, $options: "i" } },
      ];
      // number search
      if (!isNaN(search)) {
        const num = Number(search);
        searchConditions.push(
          { billableHours: num },
          { nonBillableHours: num },
          { projectsWorkedOn: num },
          { estimationsGiven: num },
          { interviewsGiven: num },
          { interviewsCracked: num },
          { bugSolvingHours: num },
          { meetingsAttended: num },
        );
      }
      // date search (YYYY-MM-DD)
      const dateQuery = dateSearchQuery("date", search);
      if (dateQuery) {
        searchConditions.push(dateQuery);
      }
      _where.$and = [{ $or: searchConditions }];
    }

    const { data, pagination } = await paginate({
      model: DRS,
      query: _where,
      page,
      limit,
      sort: { date: -1 },
      select: getProjection(["user", "createdBy"]),
    });

    return successResponse(res, 200, "DRS fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

//======================== EDIT DRS =============================
exports.updateDrs = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { id } = req.params;

    const drs = await DRS.findOne({ _id: id, isDeleted: false });

    if (!drs) {
      throw new AppError("DRS not found with given Id", 404);
    }

    if (drs.user.toString() !== userId.toString()) {
      throw new AppError("You are not authorize to Update this Drs ", 403);
    }

    Object.assign(drs, req.body, { updatedBy: userId });
    await drs.save();

    return successResponse(res, 200, "DRS changed successfully");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//=============== NOT FILLED DRS ==========================
exports.getNotFilledDrs = async (req, res, next) => {
  try {
    let { month, year } = req.query;
    const { _id: userId } = req.user;

    const now = moment.tz(TIMEZONES.INDIA).subtract(1, "day");
    const selectedMonth = month ? Number(month) : now.month() + 1;
    const selectedYear = year ? Number(year) : now.year();

    const { startOfMonth, endOfMonth } = getMonthRange(
      selectedYear,
      selectedMonth,
    );

    // limit till yesterday (If current month-syesterday , past month → full month)
    const loopEnd = endOfMonth > now.toDate() ? now.toDate() : endOfMonth;
    const dateFilter = {
      $gte: startOfMonth,
      $lte: loopEnd,
    };

    const [drsData, holidays] = await Promise.all([
      DRS.find({ user: userId, isDeleted: false, date: dateFilter }).lean(),
      HOLIDAY.find({
        isDeleted: false,
        holidayDate: dateFilter,
      }).lean(),
    ]);

    const holidaySet = new Set(holidays.map((h) => formatDate(h.holidayDate)));
    const drsMap = new Map(drsData.map((d) => [formatDate(d.date), d]));

    const result = [];
    let currentDay = moment(startOfMonth);

    while (currentDay.toDate() <= loopEnd) {
      const key = formatDate(currentDay.toDate());
      if (currentDay.day() !== 0 && !holidaySet.has(key)) {
        const record = drsMap.get(key);

        if (
          !record ||
          !(
            record.done?.trim() ||
            record.inProgress?.trim() ||
            record.nextPlan?.trim()
          )
        ) {
          result.push({ date: key, userId });
        }
      }
      currentDay.add(1, "day");
    }

    return successResponse(res, 200, "Not filled DRS fetched", {
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const moment = require("moment");

const { DRS } = require("../model/modelIndex");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { AppError } = require("../utils/error");
const { getProjection } = require("../utils/projection");
const { TIMEZONES } = require("../utils/enum");

//======================= ADD DRS =================================
exports.addDrs = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { date, onLeave, done, inProgress } = req.body;

    const selectedDate = moment
      .tz(date, "YYYY-MM-DD", TIMEZONES.INDIA)
      .startOf("day")
      .toDate();

    const isExist = await DRS.findOne({
      user: userId,
      date: selectedDate,
    }).select("_id");

    if (isExist) {
      throw new AppError("DRS already submitted for this date", 409);
    }

    if (!onLeave && !(done || inProgress)) {
      throw new AppError("Either 'done' or 'inProgress' is required", 400);
    }

    const drs = await DRS.create({
      ...req.body,
      date: selectedDate,
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

    const selectedMonth = month ? Number(month) - 1 : currentDate.getMonth();
    const selectedYear = year ? Number(year) : currentDate.getFullYear();

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
      user: userId,
      isDeleted: false,
      date: {
        $gte: startDate,
        $lte: endDate,
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
      if (moment(search, "YYYY-MM-DD", true).isValid()) {
        const start = moment(search).startOf("day").toDate();
        const end = moment(search).endOf("day").toDate();
        searchConditions.push({
          date: { $gte: start, $lte: end },
        });
      }
      _where.$and.push = [{ $or: searchConditions }];
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

    const drs = await DRS.findOne({ _id: id });

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

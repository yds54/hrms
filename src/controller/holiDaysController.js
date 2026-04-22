const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { HOLIDAY } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { getProjection } = require("../utils/projection");
const { TIMEZONES } = require("../utils/enum");

//================== INSERT HOLIDAY ===============================
exports.addHoliday = async (req, res, next) => {
  try {
    const { holidayDate, holidayReason } = req.body;

    const date = moment
      .tz(holidayDate, "YYYY-MM-DD", TIMEZONES.INDIA)
      .startOf("day");

    const start = date.clone().toDate();
    const end = date.clone().endOf("day").toDate();

    const isHolidayExists = await HOLIDAY.findOne({
      holidayDate: { $gte: start, $lte: end },
      isDeleted: false,
    }).select("_id");

    if (isHolidayExists) {
      throw new AppError("Holiday already exists for this date", 409);
    }

    const holiday = await HOLIDAY.create({
      holidayDate: start,
      holidayReason,
    });

    return successResponse(res, 200, "Holiday added successfully", {
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

//================== DISPLAY HOLIDAY ===============================
exports.viewAllHolidays = async (req, res, next) => {
  try {
    let { page, limit, filter, search } = req.query;
    const _where = { isDeleted: false };

    let year, month;

    if (filter) {
      [year, month] = filter.split("-").map(Number);
    } else {
      const currentDate = new Date();
      year = currentDate.getFullYear();
      month = currentDate.getMonth() + 1;
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    _where.holidayDate = {
      $gte: startDate,
      $lte: endDate,
    };

    //search
    if (search) {
      const searchConditions = [
        {
          holidayReason: { $regex: search, $options: "i" },
        },
      ];
      if (moment(search, "YYYY-MM-DD", true).isValid()) {
        const start = moment(search).startOf("day").toDate();
        const end = moment(search).endOf("day").toDate();
        searchConditions.push({
          holidayDate: { $gte: start, $lte: end },
        });
      }
      _where.$and = [{ $or: searchConditions }];
    }

    const { data, pagination } = await paginate({
      model: HOLIDAY,
      query: _where,
      page,
      limit,
      sort: { holidayDate: -1 },
      select: getProjection(["month", "year"]),
    });

    return successResponse(res, 200, "Holidays fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

//================== UPDATE HOLIDAY ===============================
exports.updateHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { holidayDate, holidayReason } = req.body;

    const holiday = await HOLIDAY.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!holiday) {
      throw new AppError("Holiday not found with given Id", 404);
    }

    // update holiday date
    if (holidayDate) {
      const date = moment
        .tz(holidayDate, "YYYY-MM-DD", TIMEZONES.INDIA)
        .startOf("day");

      const start = date.clone().toDate();
      const end = date.clone().endOf("day").toDate();

      const isHolidayDuplicate = await HOLIDAY.findOne({
        _id: { $ne: id },
        holidayDate: { $gte: start, $lte: end },
        isDeleted: false,
      }).select("_id");

      if (isHolidayDuplicate) {
        throw new AppError("Holiday already exists for this date", 409);
      }
      holiday.holidayDate = start;
    }

    //update holiday reason
    if (holidayReason) {
      holiday.holidayReason = holidayReason;
    }

    await holiday.save();
    return successResponse(res, 200, "Holiday updated successfully", {
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

//================== DELETE HOLIDAY ===============================
exports.deleteHoliday = async (req, res, next) => {
  try {
    const { id: holidayId } = req.params;

    const isHolidayExists = await HOLIDAY.findOne({
      _id: holidayId,
      isDeleted: false,
    }).select("_id");

    if (!isHolidayExists)
      throw new AppError("Holiday not found with given Id", 404);

    await HOLIDAY.updateOne(
      { _id: holidayId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );

    return successResponse(res, 200, "Holiday deleted sucessfully");
  } catch (error) {
    console.error("Delete holiday Error", error);
    next(error);
  }
};

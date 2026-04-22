const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { HOLIDAY } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const {
  getDayRange,
  getMonthRange,
  dateSearchQuery,
} = require("../utils/dateFormat");

//================== INSERT HOLIDAY ===============================
exports.addHoliday = async (req, res, next) => {
  try {
    const { holidayDate, holidayReason } = req.body;
    const { startOfDay, endOfDay } = getDayRange(holidayDate);

    const isHolidayExists = await HOLIDAY.findOne({
      holidayDate: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false,
    }).select("_id");

    if (isHolidayExists) {
      throw new AppError("Holiday already exists for this date", 409);
    }

    const holiday = await HOLIDAY.create({
      holidayDate: startOfDay,
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

    const { startOfMonth, endOfMonth } = getMonthRange(year, month);

    _where.holidayDate = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };

    //search
    if (search) {
      const searchConditions = [
        {
          holidayReason: { $regex: search, $options: "i" },
        },
      ];

      const dateQuery = dateSearchQuery("holidayDate", search);
      if (dateQuery) {
        searchConditions.push(dateQuery);
      }
      _where.$and = [{ $or: searchConditions }];
    }

    const { data, pagination } = await paginate({
      model: HOLIDAY,
      query: _where,
      page,
      limit,
      sort: { holidayDate: -1 },
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
      const { startOfDay, endOfDay } = getDayRange(holidayDate);

      const isHolidayDuplicate = await HOLIDAY.findOne({
        _id: { $ne: id },
        holidayDate: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: false,
      }).select("_id");

      if (isHolidayDuplicate) {
        throw new AppError("Holiday already exists for this date", 409);
      }
      holiday.holidayDate = startOfDay;
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

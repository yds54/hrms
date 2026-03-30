const mongoose = require("mongoose");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { Roles } = require("../utils/enum");
const { HOLIDAY } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { USER_STATUS } = require("../utils/enum");

exports.addHoliday = async (req, res, next) => {
  try {
    const data= { holidayDate, holidayReason } = req.body;

    if (!holidayDate || !holidayReason) {
      throw new AppError("holidayDate and holidayReason are required", 400);
    }

    const date = new Date(holidayDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const existing = await HOLIDAY.findOne({
      holidayDate: date,
      isDeleted: false,
    });

    if (existing) {
      throw new AppError("Holiday already exists for this date", 409);
    }

    const lastHoliday = await HOLIDAY.findOne({
      month,
      year,
      isDeleted: false,
    }).sort({ srNo: -1 });

    let nextSrNo = 1;

    if (lastHoliday) {
      nextSrNo = lastHoliday.srNo + 1;
    }

    const holiday = new HOLIDAY({
      holidayDate: date,
      holidayReason,
      month,
      year,
      srNo: nextSrNo,
      updatedBy: req.user?.id || null,
    });

    await holiday.save();

    return successResponse(res, 200, "Holiday added successfully", {
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

exports.viewAllHolidays = async (req, res, next) => {
  try {
    const { query } = req;
    const { page = 1, limit = 10, month, year } = query;

    const _whereCondition = { isDeleted: false };

    if (month && year) {
      _whereCondition["month"] = Number(month);
      _whereCondition["year"] = Number(year);
    }

    const { data, pagination } = await paginate({
      model: HOLIDAY,
      query: _whereCondition,
      page,
      limit,
    });

    return successResponse(res, 200, "Holidays fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteHoliday = async (req, res, next) => {
  try {
    const { id: holidayId } = req.params;

    const holiday = await HOLIDAY.findById(holidayId);

    if (!holiday) throw new AppError("Holiday not found", 404);

    holiday.isDeleted = true;
    await holiday.save();

    return successResponse(res, 200, "Holiday deleted sucessfully");
  } catch (error) {
    console.error("Delete holiday Error", error);
    next(error);
  }
};

exports.updateHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const existingHoliday = await HOLIDAY.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingHoliday) {
      throw new AppError("Holiday not found", 404);
    }

    if (data.holidayDate) {
      const date = new Date(data.holidayDate);
      data.month = date.getMonth() + 1;
      data.year = date.getFullYear();

      //  recalculate srNo if month/year changed
      const lastHoliday = await HOLIDAY.findOne({
        month: data.month,
        year: data.year,
        isDeleted: false,
        _id: { $ne: id },
      }).sort({ srNo: -1 });

      data.srNo = lastHoliday ? lastHoliday.srNo + 1 : 1;
    }

    data.updatedBy = req.user?.id || null;

    const updatedHoliday = await HOLIDAY.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    return successResponse(res, 200, "Holiday updated successfully", {
      data: updatedHoliday,
    });
  } catch (error) {
    next(error);
  }
};

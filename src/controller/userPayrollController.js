const bcrypt = require("bcryptjs");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERPAYROLL } = require("../model/modelIndex");
const { getProjection } = require("../utils/projection");
const { AppError } = require("../utils/error");

exports.addUserPayroll = async (req, res, next) => {
  try {
    const { body } = req;

    const isUserPayrollExist = await USERPAYROLL.findOne({
      userId: body.userId,
      isDeleted: false,
    }).select("_id");

    if (isUserPayrollExist) {
      throw new AppError("User payroll already exist", 409);
    }

    body.createdBy = req.user._id;
    await USERPAYROLL.create(body);
    return successResponse(res, 200, "User payroll add sucessfully");
  } catch (error) {
    next(error);
  }
};

exports.updateUserPayroll = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isUserPayrollExist = await USERPAYROLL.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id isDeleted");

    if (!isUserPayrollExist)
      throw new AppError("User's Payroll not found", 404);

    await USERPAYROLL.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "User updated successfully", {
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsersPayrolls = async (req, res, next) => {
  try {
    const { query } = req;
    const { page = 1, limit = 10 } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    const { data, pagination } = await paginate({
      model: USERPAYROLL,
      query: _whereCondition,
      populate: [{ path: "userId", select: "name.firstName name.lastName" }],
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Departments fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserPayrollById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUserExist = await USERPAYROLL.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isUserExist) {
      throw new AppError("User payroll not found", 404);
    }
    return successResponse(res, 200, "User payroll fetched successfully", {
      data: isUserExist,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUserPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUserPayrollExist = await USERPAYROLL.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isUserPayrollExist) {
      throw new AppError("User payroll not found", 404);
    }

    isUserPayrollExist.isDeleted = true;
    isUserPayrollExist.deletedAt = moment().toDate();

    await isUserPayrollExist.save();

    return successResponse(res, 200, "User payroll deleted successfully");
  } catch (error) {
    next(error);
  }
};

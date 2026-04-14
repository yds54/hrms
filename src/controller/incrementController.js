const bcrypt = require("bcryptjs");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERPAYROLL, INCREMENT } = require("../model/modelIndex");
const { getProjection } = require("../utils/projection");
const { AppError } = require("../utils/error");
const moment = require("moment");

exports.addIncrement = async (req, res, next) => {
  try {
    const { body } = req;

    const isPayrollExist = await USERPAYROLL.findOne({
      userId: body.userId,
      isDeleted: false,
    });

    if (!isPayrollExist) {
      throw new AppError("Payroll not found for this user", 404);
    }

    await USERPAYROLL.updateOne(
      { _id: payroll._id, isDeleted: false },
      {
        $set: {
          salaryAmount: body.totalSalary,
          incrementType: body.incrementMethod,
        },
      },
    );

    await INCREMENT.create(body);

    return successResponse(res, 200, "Increment added successfully", {
      salary: body.totalSalary,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsersIncrements = async (req, res, next) => {
  try {
    const { query } = req;
    const { page = 1, limit = 10 } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    const { data, pagination } = await paginate({
      model: INCREMENT,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      populate: [{ path: "userId", select: "name.firstName name.lastName" }],
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Increments fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getIncrementById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isIncrementExist = await INCREMENT.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!isIncrementExist) {
      throw new AppError("Increment not found", 404);
    }

    return successResponse(res, 200, "Increment fetched successfully", {
      data: isIncrementExist,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteIncrement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isIncrementExist = await INCREMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isIncrementExist) {
      throw new AppError("User Increment not found", 404);
    }

    isIncrementExist.isDeleted = true;
    isIncrementExist.deletedAt = moment().toDate();

    await isIncrementExist.save();

    return successResponse(res, 200, "User Increment deleted successfully");
  } catch (error) {
    next(error);
  }
};

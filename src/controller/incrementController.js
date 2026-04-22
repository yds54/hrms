const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERPAYROLL, INCREMENT } = require("../model/modelIndex");
const { getProjection } = require("../utils/projection");
const { AppError } = require("../utils/error");
const moment = require("moment");

exports.addIncrement = async (req, res, next) => {
  try {
    const { body } = req;

    const isPayrollExists = await USERPAYROLL.findOne({
      userId: body.userId,
      isDeleted: false,
    }).select("_id ");

    if (!isPayrollExists) {
      throw new AppError("Payroll not found for given userId", 404);
    }

    await Promise.all([
      USERPAYROLL.updateOne(
        { _id: payroll._id, isDeleted: false },
        {
          $set: {
            salaryAmount: body.totalSalary,
            incrementType: body.incrementMethod,
          },
        },
      ),
      INCREMENT.create(body),
    ]);

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
    const { page, limit } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    const { data, pagination } = await paginate({
      model: INCREMENT,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      populate: [
        {
          path: "userId",
          select: "name.firstName name.lastName",
          match: { isDeleted: false },
        },
      ],
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

    const isIncrementExists = await INCREMENT.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id userId incrementAmount incrementType effectiveDate");
    if (!isIncrementExists) {
      throw new AppError("Increment not found for given userId", 404);
    }

    return successResponse(res, 200, "Increment fetched successfully", {
      data: isIncrementExists,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteIncrement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isIncrementExists = await INCREMENT.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isIncrementExists) {
      throw new AppError("User Increment not found for given userId", 404);
    }

    isIncrementExists.isDeleted = true;
    isIncrementExists.deletedAt = moment().toDate();

    await isIncrementExists.save();

    return successResponse(res, 200, "User Increment deleted successfully");
  } catch (error) {
    next(error);
  }
};

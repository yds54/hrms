const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERPAYROLL, INCREMENT } = require("../model/modelIndex");
const { getProjection } = require("../utils/projection");
const { AppError } = require("../utils/error");
const { createLog } = require("../utils/createLog");
const moment = require("moment");

exports.addIncrement = async (req, res, next) => {
  try {
    const { body } = req;

    const isPayrollExists = await USERPAYROLL.findOne({
      userId: body.userId,
      isDeleted: false,
    }).select("_id");

    if (!isPayrollExists) {
      throw new AppError("Payroll not found for given userId", 404);
    }

    await USERPAYROLL.updateOne(
      { _id: isPayrollExists._id, isDeleted: false },
      {
        $set: {
          salaryAmount: body.totalSalary,
          incrementType: body.incrementMethod,
        },
      },
    );

    const increment = await INCREMENT.create(body);

    await createLog({
      userId: req.user._id,
      tableName: "increment",
      recordId: increment._id,
      action: "CREATE",
      newRecord: increment.toObject(),
    });

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
          options: { lean: true },
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

    const isIncrementExists = await INCREMENT.find({
      userId: id,
      isDeleted: false,
    }).select(
      "incrementAmount incrementPercentage effectiveFrom incrementMethod totalSalary updatedAt previousSalary",
    );
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
    });

    if (!isIncrementExists) {
      throw new AppError("User Increment not found", 404);
    }

    const isPayrollExists = await USERPAYROLL.findOne({
      userId: isIncrementExists.userId,
      isDeleted: false,
    }).select("_id");

    if (!isPayrollExists) {
      throw new AppError("Payroll record not found", 404);
    }

    await USERPAYROLL.updateOne(
      {
        _id: isPayrollExists._id,
        isDeleted: false,
      },
      {
        $set: {
          salaryAmount: isIncrementExists.previousSalary,
        },
      },
    );

    isIncrementExists.isDeleted = true;
    isIncrementExists.deletedAt = moment().toDate();

    await isIncrementExists.save();

    await createLog({
      userId: req.user._id,
      tableName: "increment",
      recordId: id,
      action: "DELETE",
      oldRecord: isIncrementExists,
    });

    return successResponse(res, 200, "User Increment deleted successfully");
  } catch (error) {
    next(error);
  }
};

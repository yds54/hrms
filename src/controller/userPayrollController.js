const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERPAYROLL } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addUserPayroll = async (req, res, next) => {
  try {
    const { body } = req;

    const isUserPayrollExists = await USERPAYROLL.findOne({
      userId: body.userId,
      isDeleted: false,
    }).select("_id");

    if (isUserPayrollExists) {
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

    const isUserPayrollExists = await USERPAYROLL.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id isDeleted");

    if (!isUserPayrollExists)
      throw new AppError("User's Payroll not found for given ID", 404);

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
    const { page, limit } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    const { data, pagination } = await paginate({
      model: USERPAYROLL,
      query: _whereCondition,
      populate: [
        {
          path: "userId",
          select: "name.firstName name.lastName",
          match: { isDeleted: false },
        },
      ],
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

    const isUserExists = await USERPAYROLL.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isUserExists) {
      throw new AppError("User payroll not found for given ID", 404);
    }
    return successResponse(res, 200, "User payroll fetched successfully", {
      data: isUserExists,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUserPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUserPayrollExists = await USERPAYROLL.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isUserPayrollExists) {
      throw new AppError("User payroll not found for given ID", 404);
    }

    isUserPayrollExists.isDeleted = true;
    isUserPayrollExists.deletedAt = moment().toDate();

    await isUserPayrollExists.save();

    return successResponse(res, 200, "User payroll deleted successfully");
  } catch (error) {
    next(error);
  }
};

const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERPAYROLL } = require("../model/modelIndex");
const { getDayRange } = require("../utils/dateFormat");
const { createLog } = require("../utils/createLog");
const { getFileUrl } = require("../utils/fileUrl");
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

    const payroll = await USERPAYROLL.create(body);

    await createLog({
      userId: req.user._id,
      tableName: "userpayroll",
      recordId: payroll._id,
      action: "CREATE",
      newRecord: payroll.toObject(),
    });

    return successResponse(res, 200, "User payroll add sucessfully");
  } catch (error) {
    next(error);
  }
};

exports.updateUserPayroll = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const oldPayroll = await USERPAYROLL.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!oldPayroll) {
      throw new AppError("User's Payroll not found for given ID", 404);
    }

    await USERPAYROLL.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    const updatedPayroll = await USERPAYROLL.findById(id).lean();

    await createLog({
      userId: req.user._id,
      tableName: "userpayroll",
      recordId: id,
      action: "UPDATE",
      oldRecord: oldPayroll,
      newRecord: updatedPayroll,
    });

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
          select: "name.firstName name.lastName employeeCode",
          match: { isDeleted: false },
          options: { lean: true },
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
      userId: id,
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

    const oldPayroll = isUserPayrollExists.toObject();

    isUserPayrollExists.isDeleted = true;
    isUserPayrollExists.deletedAt = moment().toDate();

    await isUserPayrollExists.save();

    await createLog({
      userId: req.user._id,
      tableName: "userpayroll",
      recordId: id,
      action: "DELETE",
      oldRecord: oldPayroll,
      newRecord: null,
    });

    return successResponse(res, 200, "User payroll deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getBondCompltedUsers = async (req, res, next) => {
  try {
    const { query } = req;
    const { page, limit } = query;

    const today = moment().format("YYYY-MM-DD");
    const { endOfDay } = getDayRange(today);

    const _whereCondition = {
      isDeleted: false,
      isBond: true,
      bondCompletedDate: {
        $lte: endOfDay,
      },
    };

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      {
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "userId.isDeleted": false,
        },
      },
      {
        $project: {
          bondCompletedDate: 1,
          user: {
            _id: "$userId._id",
            employeeCode: "$userId.employeeCode",
            name: "$userId.fullName",
            profilePicture: "$userId.profilePicture",
          },
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: USERPAYROLL,
      query: _whereCondition,
      pipeline,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    const formattedData = data.map((item) => {
      if (item.user?.profilePicture?.fileName) {
        item.user.profilePicture.url = getFileUrl(
          `profile/${item.user.profilePicture.fileName}`,
        );
      }

      return item;
    });

    return successResponse(
      res,
      200,
      "Bond completed users fetched successfully",
      {
        data: formattedData,
        pagination,
      },
    );
  } catch (error) {
    next(error);
  }
};

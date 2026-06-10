const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { BANK } = require("../model/modelIndex");
const { createLog } = require("../utils/createLog");
const { AppError } = require("../utils/error");

exports.addBank = async (req, res, next) => {
  try {
    const { body } = req;

    const isBankExists = await BANK.findOne({
      bankName: body.bankName,
      isDeleted: false,
    }).select("_id");

    if (isBankExists)
      throw new AppError("Bank with the given name already exists", 409);

    body.createdBy = req.user._id;

    const bank = await BANK.create(body);

    await createLog({
      userId: req.user._id,
      tableName: "bank",
      recordId: bank._id,
      action: "CREATE",
      newRecord: bank.toObject(),
    });

    return successResponse(res, 200, "Bank Add sucessfully", {
      bankName: body.bankName,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBanks = async (req, res, next) => {
  try {
    const { query } = req;
    const { page, limit, bankName } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (bankName) {
      _whereCondition.bankName = {
        $regex: bankName,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model: BANK,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Banks fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBank = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isBankExists = await BANK.findOne({
      _id: id,
      isDeleted: false,
    })
      .select("_id")
      .lean();

    if (!isBankExists) {
      throw new AppError("Bank not found for given ID", 404);
    }

    const bankExists = await BANK.findOne({
      bankName: payload.bankName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (bankExists) {
      throw new AppError("bank with the given name already exists", 409);
    }

    await BANK.updateOne({ _id: id, isDeleted: false }, { $set: payload });

    const updatedBank = await BANK.findById(id).lean();

    await createLog({
      userId: req.user._id,
      tableName: "bank",
      recordId: id,
      action: "UPDATE",
      oldRecord: isBankExists,
      newRecord: updatedBank,
    });

    return successResponse(res, 200, "Bank updated successfully", {
      data: updatedBank,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBank = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isBankExists = await BANK.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isBankExists) {
      throw new AppError("Bank not found for given ID", 404);
    }

    isBankExists.isDeleted = true;
    isBankExists.deletedAt = moment().toDate();

    await isBankExists.save();

    return successResponse(res, 200, "Bank deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getBankById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isBankExists = await BANK.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id bankName");

    if (!isBankExists) {
      throw new AppError("Bank not found for given ID", 404);
    }

    return successResponse(res, 200, "Bank fetched sucessfully", {
      data: isBankExists,
    });
  } catch (error) {
    next(error);
  }
};

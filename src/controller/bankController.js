const mongoose = require("mongoose");
const moment = require("moment");

require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { BANK } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addBank = async (req, res, next) => {
  try {
    const { body } = req;

    const isBankExists = await BANK.findOne({
      bankName: body.bankName,
      isDeleted: false,
    }).select("_id");

    if (isBankExists) throw new AppError("Bank already exists", 409);

    body.createdBy = req.user._id;
    await BANK.create(body);

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
    const { page = 1, limit = 10, bankName } = query;

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
    }).select("_id");

    if (!isBankExists) {
      throw new AppError("Bank not found", 404);
    }

    if (isBankExists) {
      const bankExists = await BANK.findOne({
        bankName: payload.bankName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (bankExists) {
        throw new AppError("bank already exists", 409);
      }
    }

    await BANK.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Bank updated successfully", {
      data: payload.bankName,
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
      throw new AppError("Bank not found", 404);
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
    });

    if (!isBankExists) {
      throw new AppError("Bank not found", 404);
    }

    return successResponse(res, 200, "Bank fetched sucessfully", {
      data: isBankExists,
    });
  } catch (error) {
    next(error);
  }
};

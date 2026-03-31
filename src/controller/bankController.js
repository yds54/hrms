const mongoose = require("mongoose");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { BANK } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addBank = async (req, res, next) => {
  try {
    const data = { ...req.body };

    const isBankExist = await BANK.findOne({
      bankName: data.bankName,
      isDeleted: false,
    });

    if (isBankExist) throw new AppError("Bank already exists", 409);

    const department = new BANK(data);
    await department.save();

    return successResponse(res, 200, "Bank Add sucessfully", {
      bankName: department.bankName,
    });
  } catch (error) {
    console.log(error);
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
      page: Number(page),
      limit: Number(limit),
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
    const { id } = req.params;
    const { bankName } = req.body;

    const bank = await BANK.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!bank) {
      throw new AppError("Bank not found", 404);
    }

    if (bank) {
      const exists = await BANK.findOne({
        bankName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (exists) {
        throw new AppError("bank already exists", 409);
      }

      bank.bankName = bankName;
    }

    bank.updatedBy = req.user?.id || null;

    await bank.save();

    return successResponse(res, 200, "Bank updated successfully", {
      data: bank,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBank = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await BANK.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!department) {
      throw new AppError("Bank not found", 404);
    }

    department.isDeleted = true;
    department.deletedBy = req.user?.id || null;

    await department.save();

    return successResponse(res, 200, "Bank deleted successfully");
  } catch (error) {
    next(error);
  }
};



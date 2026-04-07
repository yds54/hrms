const mongoose = require("mongoose");
const moment = require("moment");

require("dotenv").config();

const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { ASSETCATEGORY } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addAssetCategory = async (req, res, next) => {
  try {
    const { body, user } = req;

    const isAssetCategoryExist = await ASSETCATEGORY.findOne({
      assetcategoryName: body.assetcategoryName,
      isDeleted: false,
    });

    if (isAssetCategoryExist) {
      throw new AppError("Asset category already exists", 409);
    }
    body.createdBy = user._id;
    await ASSETCATEGORY.create(body);

    return successResponse(res, 200, "Asset category added successfully", {
      result: body,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAssetCategorie = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, assetcategoryName } = req.query;

    const _whereCondition = { isDeleted: false };

    if (assetcategoryName) {
      _whereCondition.assetcategoryName = {
        $regex: assetcategoryName,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model: ASSETCATEGORY,
      query: _whereCondition,
      page: Number(page),
      limit: Number(limit),
    });

    return successResponse(res, 200, "Asset categories fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAssetCategory = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isassetcategoryExists = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isassetcategoryExists) {
      throw new AppError("Asset category not found", 404);
    }

    if (payload.assetcategoryName) {
      const exists = await ASSETCATEGORY.findOne({
        assetcategoryName: payload.assetcategoryName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (exists) {
        throw new AppError("Asset category already exists", 409);
      }
    }

    await ASSETCATEGORY.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Asset category updated successfully", {
      data: payload.assetcategoryName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssetCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isassetcategoryExists = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isassetcategoryExists) {
      throw new AppError("Asset category not found", 404);
    }

    isassetcategoryExists.isDeleted = true;
    isassetcategoryExists.deletedAt = moment().toDate();
    await isassetcategoryExists.save();

    return successResponse(res, 200, "Asset category deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getassetcategorybyId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isassetcategoryExist = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isassetcategoryExist) {
      throw new AppError("Asset category not found", 404);
    }

    return successResponse(res, 200, "Asset category fetched successfully", {
      data: isassetcategoryExist,
    });
  } catch (error) {
    next(error);
  }
};

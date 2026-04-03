const mongoose = require("mongoose");
const moment = require("moment");

require("dotenv").config();

const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { ASSETCATEGORY } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addAssetCategory = async (req, res, next) => {
  try {
    const isAssetCategoryExist = await ASSETCATEGORY.findOne({
      assetcategoryName: req.body.assetcategoryName,
      isDeleted: false,
    });

    if (isAssetCategoryExist) {
      throw new AppError("Asset category already exists", 409);
    }
    req.body.createdBy = req.user._id;
    await ASSETCATEGORY.create(req.body);

    return successResponse(res, 200, "Asset category added successfully", {result: req.body});
  } catch (error) {
    next(error);
  }
};

exports.getAllAssetCategorie = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, assetcategoryName } = req.query;

    const _whereCondition = {
      isDeleted: false,
    };

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

    const category = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    });


    if (!category) {
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

    await ASSETCATEGORY.updateOne({ _id: id }, { $set: { ...payload } });

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

    const category = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      throw new AppError("Asset category not found", 404);
    }

    category.isDeleted = true;
    category.deletedAt = moment().toDate();
    await category.save();

    return successResponse(res, 200, "Asset category deleted successfully");
  } catch (error) {
    next(error);
  }
};

const mongoose = require("mongoose");
const moment = require("moment");

require("dotenv").config();

const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { ASSET } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addAsset = async (req, res, next) => {
  try {
    const isAssetExist = await ASSET.findOne({
      assetName: req.body.assetName,
      assetcategoryId: req.body.assetcategoryId,
      isDeleted: false,
    });

    if (isAssetExist) {
      throw new AppError("Asset already exist in this AssetCategory", 409);
    }
    req.body.createdBy = req.user._id;
    await ASSET.create(req.body);

    return successResponse(res, 200, "Asset added successfully", {
      assetName: req.body.assetName,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAssets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      assetName,
      assetcategoryId,
      relatedTo,
    } = req.query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (assetName) {
      _whereCondition.assetName = {
        $regex: assetName,
        $options: "i",
      };
    }

    if (assetcategoryId) {
      _whereCondition.assetcategoryId = assetcategoryId;
    }

    if (relatedTo) {
      _whereCondition.relatedTo = relatedTo;
    }

    const { data, pagination } = await paginate({
      model: ASSET,
      query: _whereCondition,
      page: Number(page),
      limit: Number(limit),
      populate: [
        { path: "assetcategoryId", select: "assetcategoryName" },
        { path: "relatedTo", select: "firstName lastName email" },
      ],
    });

    return successResponse(res, 200, "Assets fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAsset = async (req, res, next) => {
  try {
        const { params, body: payload } = req;
    const { id } = params;

    let asset = await ASSET.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!asset) {
      throw new AppError("Asset not found", 404);
    }

    if(payload.assetName || payload.assetcategoryId) {
      const isAssetExist = await ASSET.findOne({
        assetName: payload.assetName,
        assetcategoryId: payload.assetcategoryId,
        isDeleted: false,
      });

      if (isAssetExist && isAssetExist._id.toString() !== id) {
        throw new AppError("Asset already exist in this AssetCategory", 409);
      }
    }

    await ASSET.updateOne({_id: id}, { $set: { ...payload } });

    return successResponse(res, 200, "Asset updated successfully", {
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await ASSET.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!asset) {
      throw new AppError("Asset not found", 404);
    }

    asset.isDeleted = true;
    asset.deletedAt = moment().toDate();

    await asset.save();

    return successResponse(res, 200, "Asset deleted successfully");
  } catch (error) {
    next(error);
  }
};

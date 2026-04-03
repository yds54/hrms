const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { AppError } = require("../utils/error");
const ASSETMANAGEMENT = require("../model/assetmanagement");

exports.addAssetManagement = async (req, res, next) => {
  try {
    const { body, user } = req;

    const isExist = await ASSETMANAGEMENT.findOne({
      assetId: body.assetId,
      relatedTo: body.relatedTo,
      isDeleted: false,
    });

    if (isExist) {
      throw new AppError("Asset already assigned to this user", 409);
    }

    body.createdBy = user._id;

    await ASSETMANAGEMENT.create(body);

    return successResponse(res, 200, "Asset assigned successfully", {
      data: body,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAssetManagement = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,

      relatedTo,
    } = req.query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (relatedTo) _whereCondition.relatedTo = relatedTo;

    const { data, pagination } = await paginate({
      model: ASSETMANAGEMENT,
      query: _whereCondition,
      page: Number(page),
      limit: Number(limit),
      populate: [
        { path: "assetId", select: "assetName" },
        { path: "assetcategoryId", select: "assetcategoryName" },
        { path: "relatedTo", select: "name" },
      ],
    });

    return successResponse(res, 200, "Asset assignments fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAssetManagement = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const asset = await ASSETMANAGEMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!asset) {
      throw new AppError("Asset assignment not found", 404);
    }

    if (payload.assetId && payload.relatedTo) {
      const isExist = await ASSETMANAGEMENT.findOne({
        assetId: payload.assetId,
        relatedTo: payload.relatedTo,
        isDeleted: false,
      });

      if (isExist && isExist._id.toString() !== id) {
        throw new AppError("Asset already assigned to this user", 409);
      }
    }

    await ASSETMANAGEMENT.updateOne({ _id: id }, { $set: { ...payload } });

    return successResponse(res, 200, "Asset assignment updated successfully", {
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssetManagement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await ASSETMANAGEMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!asset) {
      throw new AppError("Asset assignment not found", 404);
    }

    asset.isDeleted = true;
    asset.deletedAt = moment().toDate();

    await asset.save();

    return successResponse(res, 200, "Asset assignment deleted successfully");
  } catch (error) {
    next(error);
  }
};

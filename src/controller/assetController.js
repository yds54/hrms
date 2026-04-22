const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { ASSET, ASSETMANAGEMENT } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addAsset = async (req, res, next) => {
  try {
    const { body, user } = req;

    const isAssetExists = await ASSET.findOne({
      assetName: body.assetName,
      assetCategoryId: body.assetCategoryId,
      isDeleted: false,
    }).select("_id");

    if (isAssetExists) {
      throw new AppError("Asset already exists in given AssetCategory", 409);
    }
    body.createdBy = user._id;
    await ASSET.create(body);

    return successResponse(res, 200, "Asset added successfully", {
      assetName: body.assetName,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAssets = async (req, res, next) => {
  try {
    const { page, limit, assetName, assetCategoryId, relatedTo } = req.query;

    const _whereCondition = { isDeleted: false };

    if (assetName) {
      _whereCondition.assetName = {
        $regex: assetName,
        $options: "i",
      };
    }
    if (assetCategoryId) _whereCondition.assetCategoryId = assetCategoryId;
    if (relatedTo) _whereCondition.relatedTo = relatedTo;

    const { data, pagination } = await paginate({
      model: ASSET,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      populate: [
        {
          path: "assetCategoryId",
          select: "assetCategoryName",
          match: { isDeleted: false },
        },
      ],
      sort: { createdAt: -1 },
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

    const isAssetExists = await ASSET.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isAssetExists) {
      throw new AppError("Asset not found for given ID", 404);
    }

    if (payload.assetName && payload.assetcategoryId) {
      const AssetExists = await ASSET.findOne({
        assetName: payload.assetName,
        assetCategoryId: payload.assetCategoryId,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (AssetExists) {
        throw new AppError("Asset already exist in given AssetCategory", 409);
      }
    }

    await ASSET.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Asset updated successfully", {
      data: payload.assetName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAssetExists = await ASSET.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isAssetExists) {
      throw new AppError("Asset not found for given ID", 404);
    }

    const deletedAt = moment().toDate();

    isAssetExists.isDeleted = true;
    isAssetExists.deletedAt = deletedAt;

    await Promise.all([
      isAssetExists.save(),
      ASSETMANAGEMENT.updateMany(
        {
          assetId: id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            deletedAt: deletedAt,
          },
        },
      ),
    ]);

    return successResponse(
      res,
      200,
      "Asset and related assignments deleted successfully",
    );
  } catch (error) {
    next(error);
  }
};

exports.getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAssetExists = await ASSET.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id assetName assetcategoryId");

    if (!isAssetExists) {
      throw new AppError("Asset not found for given ID", 404);
    }

    return successResponse(res, 200, "Asset fetched successfully", {
      data: isAssetExists,
    });
  } catch (error) {
    next(error);
  }
};

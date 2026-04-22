const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const {
  ASSETCATEGORY,
  ASSET,
  ASSETMANAGEMENT,
} = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addAssetCategory = async (req, res, next) => {
  try {
    const { body, user } = req;

    const isAssetCategoryExists = await ASSETCATEGORY.findOne({
      assetCategoryName: body.assetCategoryName,
      isDeleted: false,
    }).select("_id");

    if (isAssetCategoryExists) {
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

exports.getAllAssetCategories = async (req, res, next) => {
  try {
    const { page, limit, assetCategoryName } = req.query;

    const _whereCondition = { isDeleted: false };

    if (assetCategoryName) {
      _whereCondition.assetCategoryName = {
        $regex: assetCategoryName,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model: ASSETCATEGORY,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
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

    const isAssetCategoryExists = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isAssetCategoryExists) {
      throw new AppError("Asset category not found for given ID", 404);
    }

    const assetCategoryExists = await ASSETCATEGORY.findOne({
      assetCategoryName: payload.assetCategoryName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (assetCategoryExists) {
      throw new AppError("Asset category already exists", 409);
    }

    await ASSETCATEGORY.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Asset category updated successfully", {
      data: payload.assetCategoryName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssetCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAssetCategoryExists = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isAssetCategoryExists) {
      throw new AppError("Asset category not found with given ID", 404);
    }

    const deletedAt = moment().toDate();

    isAssetCategoryExists.isDeleted = true;
    isAssetCategoryExists.deletedAt = deletedAt;

    await Promise.all([
      isAssetCategoryExists.save(),
      ASSET.updateMany(
        {
          assetCategoryId: id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            deletedAt,
          },
        },
      ),
      ASSETMANAGEMENT.updateMany(
        {
          assetCategoryId: id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            deletedAt,
          },
        },
      ),
    ]);

    return successResponse(res, 200, "Asset category deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getAssetCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAssetCategoryExists = await ASSETCATEGORY.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id assetcategoryName");

    if (!isAssetCategoryExists) {
      throw new AppError("Asset category not found for given ID", 404);
    }

    return successResponse(res, 200, "Asset category fetched successfully", {
      data: isAssetCategoryExists,
    });
  } catch (error) {
    next(error);
  }
};

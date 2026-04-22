const mongoose = require("mongoose");
const moment = require("moment");

const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { AppError } = require("../utils/error");
const { ASSETMANAGEMENT } = require("../model/modelIndex");
const { ROLES } = require("../utils/enum");
const { Types } = mongoose;

exports.addAssetManagement = async (req, res, next) => {
  try {
    const { body, user } = req;

    const isAssetExists = await ASSETMANAGEMENT.findOne({
      assetId: body.assetId,
      relatedTo: body.relatedTo,
      isDeleted: false,
    });

    if (isAssetExists) {
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
    const { _id: userId, role } = req.user;

    const {
      page,
      limit,
      search = "",
      relatedTo,
      assetId,
      assetCategoryId,
    } = req.query;

    const _whereCondition = {
      isDeleted: false,
      ...(role === ROLES.USER
        ? { relatedTo: new Types.ObjectId(userId) }
        : relatedTo
          ? { relatedTo: new Types.ObjectId(relatedTo) }
          : {}),
    };

    if (assetId) {
      _whereCondition.assetId = new Types.ObjectId(assetId);
    }

    if (assetCategoryId) {
      _whereCondition.assetCategoryId = new Types.ObjectId(assetCategoryId);
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          let: { relatedToId: "$relatedTo" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$relatedToId"] },
                isDeleted: false,
              },
            },
            {
              $project: {
                _id: 1,
                employeeCode: 1,
                fullName: {
                  $concat: ["$name.firstName", " ", "$name.lastName"],
                },
              },
            },
          ],
          as: "relatedTo",
        },
      },
      {
        $unwind: {
          path: "$relatedTo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "assets",
          let: { assetId: "$assetId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$assetId"] },
                isDeleted: false,
              },
            },
            {
              $project: {
                _id: 1,
                assetName: 1,
              },
            },
          ],
          as: "asset",
        },
      },
      {
        $unwind: {
          path: "$asset",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "assetcategories",
          let: { categoryId: "$assetCategoryId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$categoryId"] },
                isDeleted: false,
              },
            },
            {
              $project: {
                _id: 1,
                assetCategoryName: 1,
              },
            },
          ],
          as: "assetCategory",
        },
      },
      {
        $unwind: {
          path: "$assetCategory",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          issueDateString: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$issueDate",
            },
          },
        },
      },

      ...(search
        ? [
            {
              $match: {
                $or: [
                  {
                    "relatedTo.employeeCode": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "relatedTo.fullName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "asset.assetName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "assetCategory.assetCategoryName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    remark: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    issueDateString: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
          ]
        : []),

      {
        $project: {
          issueDateString: 0,
        },
      },
    ];

    const result = await paginate({
      model: ASSETMANAGEMENT,
      query: _whereCondition,
      page,
      limit,
      pipeline,
    });

    return successResponse(
      res,
      200,
      "Asset assignments fetched successfully",
      result,
    );
  } catch (error) {
    next(error);
  }
};

exports.updateAssetManagement = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isAssetExists = await ASSETMANAGEMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isAssetExists) {
      throw new AppError("Asset assignment not found for given ID", 404);
    }

    if (payload.assetId && payload.relatedTo) {
      const isAssetAssignmentExists = await ASSETMANAGEMENT.findOne({
        assetId: payload.assetId,
        relatedTo: payload.relatedTo,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (isAssetAssignmentExists) {
        throw new AppError(
          "This asset is already assigned to given user.",
          409,
        );
      }
    }

    await ASSETMANAGEMENT.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

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

    const isAssetExists = await ASSETMANAGEMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isAssetExists) {
      throw new AppError("Asset assignment not found for given ID", 404);
    }

    isAssetExists.isDeleted = true;
    isAssetExists.deletedAt = moment().toDate();

    await isAssetExists.save();

    return successResponse(res, 200, "Asset assignment deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getAssetManagementById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAssetManagementExists = await ASSETMANAGEMENT.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id assetId assetcategoryId relatedTo assignedDate returnDate");

    if (!isAssetManagementExists) {
      throw new AppError("Asset assignment not found for given ID", 404);
    }

    return successResponse(res, 200, "Asset assignment fetched successfully", {
      data: isAssetManagementExists,
    });
  } catch (error) {
    next(error);
  }
};

const mongoose = require("mongoose");
const moment = require("moment");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { DESIGNATION } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { path } = require("../../app");

exports.addDesignation = async (req, res, next) => {
  try {
    const { body } = req;
    const isDesignationExist = await DESIGNATION.findOne({
      designationName: body.designationName,
      departmentId: body.departmentId,
      isDeleted: false,
    });

    if (isDesignationExist) {
      throw new AppError("Designation already exists in this department", 409);
    }
    body.createdBy = req.user._id;
    await DESIGNATION.create(body);

    return successResponse(res, 200, "Designation added successfully", {});
  } catch (error) {
    next(error);
  }
};
exports.getAllDesignation = async (req, res, next) => {
  try {
    const { query } = req;
    const { page = 1, limit = 10, departmentId } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (departmentId) {
      _whereCondition.departmentId = departmentId;
    }

    const { data, pagination } = await paginate({
      model: DESIGNATION,
      query: _whereCondition,
      populate: [{ path: "departmentId", select: "departmentName" }],
      page: Number(page),
      limit: Number(limit),
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Designation fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDesignation = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isDesignationExist = await DESIGNATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isDesignationExist) {
      throw new AppError("Designation not found", 404);
    }

    if (payload.designationName) {
      const designationExist = await DESIGNATION.findOne({
        designationName: payload.designationName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (designationExist) {
        throw new AppError("designation already exists", 409);
      }
    }

    await DESIGNATION.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Designation updated successfully", {
      data: payload.designationName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDesignation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isDesignationExist = await DESIGNATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isDesignationExist) {
      throw new AppError("Designation not found", 404);
    }

    isDesignationExist.isDeleted = true;
    isDesignationExist.deletedAt = moment().toDate();

    await isDesignationExist.save();

    return successResponse(res, 200, "Designation deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getDesignationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isDesignationExist = await DESIGNATION.findOne({
      _id: id,
      isDeleted: false,
    }).populate({ path: "departmentId", select: "departmentName" });

    if (!isDesignationExist) {
      throw new AppError("Designation not found", 404);
    }

    return successResponse(res, 200, "Designation fetched successfully", {
      data: isDesignationExist,
    });
  } catch (error) {
    next(error);
  }
};

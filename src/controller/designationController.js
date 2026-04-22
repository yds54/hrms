const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { DESIGNATION } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { path } = require("../../app");

exports.addDesignation = async (req, res, next) => {
  try {
    const { body } = req;
    const isDesignationExists = await DESIGNATION.findOne({
      designationName: body.designationName,
      departmentId: body.departmentId,
      isDeleted: false,
    }).select("_id");

    if (isDesignationExists) {
      throw new AppError(
        "Designation already exists in given departmentId",
        409,
      );
    }
    body.createdBy = req.user._id;
    await DESIGNATION.create(body);

    return successResponse(res, 200, "Designation added successfully");
  } catch (error) {
    next(error);
  }
};
exports.getAllDesignation = async (req, res, next) => {
  try {
    const { query } = req;
    const { page, limit, departmentId, designationName } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (departmentId) {
      _whereCondition.departmentId = departmentId;
    }
    if (designationName) {
      _whereCondition.designationName = {
        $regex: designationName,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model: DESIGNATION,
      query: _whereCondition,
      populate: [
        {
          path: "departmentId",
          select: "departmentName",
          match: { isDeleted: false },
        },
      ],
      page: +page,
      limit: +limit,
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

    const isDesignationExists = await DESIGNATION.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isDesignationExists) {
      throw new AppError("Designation not found for given ID", 404);
    }

    const designationExists = await DESIGNATION.findOne({
      designationName: payload.designationName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (designationExists) {
      throw new AppError("designation already exists", 409);
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
    }).select("_id");

    if (!isDesignationExist) {
      throw new AppError("Designation not found for given ID", 404);
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
    })
      .populate({
        path: "departmentId",
        select: "departmentName",
        match: { isDeleted: false },
      })
      .select("_id designationName departmentId");

    if (!isDesignationExist) {
      throw new AppError("Designation not found for given ID", 404);
    }

    return successResponse(res, 200, "Designation fetched successfully", {
      data: isDesignationExist,
    });
  } catch (error) {
    next(error);
  }
};

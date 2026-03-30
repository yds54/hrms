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
    const data = { ...req.body };

    const isDesignationExist = await DESIGNATION.findOne({
      designationName: data.designationName,
      departmentName: data.departmentName,
      isDeleted: false,
    });

    if (isDesignationExist) {
      throw new AppError("Designation already exists in this department", 409);
    }

    const designation = new DESIGNATION({...data});

    await designation.save();

    return successResponse(res, 200, "Designation added successfully", {
      designationName: designation.designationName,
      createdAt: moment(designation.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    });
} catch (error) {
    console.log(error);
    next(error);
}
};

exports.getAllDesignation = async (req, res, next) => {
  try {
    const { query } = req;
    const { page = 1, limit = 10, departmentName } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (departmentName) {
      _whereCondition.departmentName = {
        $regex: departmentName,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model:DESIGNATION ,
      query: _whereCondition,
      populate:[{path:"departmentName",select: "departmentName"}],
      page: Number(page),
      limit: Number(limit),
    });

    return successResponse(res, 200, "Departments fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDesignation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const designation = await DESIGNATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!designation) {
      throw new AppError("Designation not found", 404);
    }

    designation.isDeleted = true;
    designation.deletedBy = req.user?.id || null;
    
    await designation.save();
    
    return successResponse(res, 200, "Designation deleted successfully");
} catch (error) {
    next(error);
}
};

exports.updateDesignation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { designationName } = req.body;

    const department = await DESIGNATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    if (designationName) {
      const exists = await DESIGNATION.findOne({
        designationName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (exists) {
        throw new AppError("designation already exists", 409);
      }

      department.designationName = designationName;
    }

    department.updatedBy = req.user?.id || null;

    await department.save();

    return successResponse(res, 200, "Department updated successfully", {
      data: department,
    });
  } catch (error) {
    next(error);
  }
};


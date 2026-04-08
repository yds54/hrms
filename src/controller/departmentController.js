const mongoose = require("mongoose");
const moment = require("moment");

require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { DEPARTMENT } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addDepartment = async (req, res, next) => {
  try {
    const { body } = req;
    const isDepartmentExist = await DEPARTMENT.findOne({
      departmentName: body.departmentName,
      isDeleted: false,
    });

    if (isDepartmentExist) throw new AppError("Departmant already exists", 409);
    body.createdBy = req.user._id;
    await DEPARTMENT.create(body);

    return successResponse(res, 200, "Department Add sucessfully", {});
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isDepartmentExist = await DEPARTMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isDepartmentExist) {
      throw new AppError("Department not found", 404);
    }

    if (payload.departmentName) {
      const departmentExist = await DEPARTMENT.findOne({
        departmentName: payload.departmentName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (departmentExist) {
        throw new AppError("Department already exists", 409);
      }
    }

    await DEPARTMENT.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Department updated successfully", {
      data: payload.departmentName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isDepartmentExist = await DEPARTMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isDepartmentExist) {
      throw new AppError("Department not found", 404);
    }

    isDepartmentExist.isDeleted = true;
    isDepartmentExist.deletedAt = moment().toDate();

    await isDepartmentExist.save();

    return successResponse(res, 200, "Department deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getAllDepartments = async (req, res, next) => {
  try {
    const { query } = req;
    const { page = 1, limit = 10, departmentName } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (departmentName) {
      _whereCondition.departmentName = {
        $regex: departmentName,
        $options: "i", // case-insensitive
      };
    }

    const { data, pagination } = await paginate({
      model: DEPARTMENT,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Departments fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isDepartmentExist = await DEPARTMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isDepartmentExist) {
      throw new AppError("Department not found", 404);
    }

    return successResponse(res, 200, "Department fetched successfully", {
      data: isDepartmentExist,
    });
  } catch (error) {
    next(error);
  }
};

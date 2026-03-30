const mongoose = require("mongoose");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { Department } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addDepartment = async (req, res, next) => {
  try {
    const data = { ...req.body };

    const isDepartmentExist = await Department.findOne({
      departmentName: data.departmentName,
      isDeleted: false,
    });

    if (isDepartmentExist) throw new AppError("Departmant already exists", 409);

    const department = new Department(data);
    await department.save();

    return successResponse(res, 200, "Department Add sucessfully", {
      departmentName: department.departmentName,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentName } = req.body;

    const department = await Department.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    if (departmentName) {
      const exists = await Department.findOne({
        departmentName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (exists) {
        throw new AppError("Department already exists", 409);
      }

      department.departmentName = departmentName;
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

exports.deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await Department.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    department.isDeleted = true;
    department.deletedBy = req.user?.id || null;

    await department.save();

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
      model: Department,
      query: _whereCondition,
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

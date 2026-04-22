const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { DEPARTMENT, DESIGNATION } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addDepartment = async (req, res, next) => {
  try {
    const { body } = req;
    const isDepartmentExists = await DEPARTMENT.findOne({
      departmentName: body.departmentName,
      isDeleted: false,
    }).select("_id");

    if (isDepartmentExists)
      throw new AppError("department with the given name already exists", 409);
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

    const isDepartmentExists = await DEPARTMENT.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isDepartmentExists) {
      throw new AppError("Department not found for given ID", 404);
    }

    const departmentExists = await DEPARTMENT.findOne({
      departmentName: payload.departmentName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (departmentExists) {
      throw new AppError("department with the given name already exists", 409);
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

    const department = await DEPARTMENT.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!department) {
      throw new AppError("Department not found for given ID", 404);
    }

    const deletedAt = moment().toDate();

    department.isDeleted = true;
    department.deletedAt = deletedAt;

    await Promise.all([
      department.save(),
      DESIGNATION.updateMany(
        {
          departmentId: id,
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
      "Department and related designations deleted successfully",
    );
  } catch (error) {
    next(error);
  }
};

exports.getAllDepartments = async (req, res, next) => {
  try {
    const { query } = req;
    const { page, limit, departmentName } = query;

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

    const isDepartmentExists = await DEPARTMENT.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id departmentName");

    if (!isDepartmentExists) {
      throw new AppError("Department not found for given ID", 404);
    }

    return successResponse(res, 200, "Department fetched successfully", {
      data: isDepartmentExists,
    });
  } catch (error) {
    next(error);
  }
};

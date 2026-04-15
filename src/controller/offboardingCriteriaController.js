const mongoose = require("mongoose");
const moment = require("moment");

require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { OFFBORADINGCRITERIA } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addCriteria = async (req, res, next) => {
  try {
    const { body } = req;

    const isCriteriaExists = await OFFBORADINGCRITERIA.findOne({
      criteria: body.criteria,
      isDeleted: false,
    }).select("_id");

    if (isCriteriaExists) throw new AppError("Criteria already exists", 409);

    body.createdBy = req.user._id;
    await OFFBORADINGCRITERIA.create(body);

    return successResponse(res, 200, "Criteria Add sucessfully", {});
  } catch (error) {
    next(error);
  }
};

exports.getAllCriteria = async (req, res, next) => {
  try {
    const { query } = req;
    const { page = 1, limit = 10, criteria } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (criteria) {
      _whereCondition.criteria = {
        $regex: criteria,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model: OFFBORADINGCRITERIA,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Criteria fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCriteria = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isCriteriaExists = await OFFBORADINGCRITERIA.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isCriteriaExists) {
      throw new AppError("Criteria not found", 404);
    }

    if (isCriteriaExists) {
      const criteriaExists = await OFFBORADINGCRITERIA.findOne({
        criteria: payload.criteria,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (criteriaExists) {
        throw new AppError("Criteria already exists", 409);
      }
    }

    await OFFBORADINGCRITERIA.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Criteria updated successfully", {
      data: payload.criteria,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCriteria = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isCriteriaExists = await OFFBORADINGCRITERIA.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isCriteriaExists) {
      throw new AppError("Criteria not found", 404);
    }

    isCriteriaExists.isDeleted = true;
    isCriteriaExists.deletedAt = moment().toDate();

    await isCriteriaExists.save();

    return successResponse(res, 200, "Criteria deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getCriteriaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isCriteriaExists = await OFFBORADINGCRITERIA.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isCriteriaExists) {
      throw new AppError("Criteria not found", 404);
    }

    return successResponse(res, 200, "Criteria fetched successfully", {
      data: isCriteriaExists,
    });
  } catch (error) {
    next(error);
  }
};

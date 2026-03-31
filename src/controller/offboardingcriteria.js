const mongoose = require("mongoose");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { OFFBORADINGCRITERIA } = require("../model/modelIndex");
const { AppError } = require("../utils/error");


exports.addCriteria = async (req, res, next) => {
  try {
    const data = { ...req.body };

    const isCriteriaExist = await OFFBORADINGCRITERIA.findOne({
      criteria: data.criteria,
      isDeleted: false,
    });

    if (isCriteriaExist) throw new AppError("Criteria already exists", 409);

    const Criteria = new OFFBORADINGCRITERIA(data);
    await Criteria.save();

    return successResponse(res, 200, "Criteria Add sucessfully", {
      CriteriaName: Criteria.criteria,
    });
  } catch (error) {
    console.log(error);
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
      page: Number(page),
      limit: Number(limit),
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
    const { id } = req.params;
    const { criteria } = req.body;

    const criterias = await OFFBORADINGCRITERIA.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!criterias) {
      throw new AppError("Criteria not found", 404);
    }

    if (criterias) {
      const exists = await OFFBORADINGCRITERIA.findOne({
        criteria,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (exists) {
        throw new AppError("Criteria already exists", 409);
      }

      criterias.criteria = criteria;
    }

    criterias.updatedBy = req.user?.id || null;

    await criterias.save();

    return successResponse(res, 200, "Criteria updated successfully", {
      data: criterias,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCriteria = async (req, res, next) => {
  try {
    const { id } = req.params;

    const criterias = await OFFBORADINGCRITERIA.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!criterias) {
      throw new AppError("Criteria not found", 404);
    }

    criterias.isDeleted = true;
    criterias.deletedBy = req.user?.id || null;

    await criterias.save();

    return successResponse(res, 200, "Criteria deleted successfully");
  } catch (error) {
    next(error);
  }
};

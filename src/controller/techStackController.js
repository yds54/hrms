const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { TECHSTACK } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addTechStack = async (req, res, next) => {
  try {
    const { body } = req;

    const isTechStackExists = await TECHSTACK.findOne({
      techName: body.techName,
      isDeleted: false,
    }).select("_id");

    if (isTechStackExists) {
      throw new AppError("Tech stack with the given name already exists", 409);
    }

    body.createdBy = req.user._id;

    await TECHSTACK.create(body);

    return successResponse(res, 200, "Tech stack added successfully", {
      techName: body.techName,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTechStacks = async (req, res, next) => {
  try {
    const { query } = req;
    const { page, limit, techName } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (techName) {
      _whereCondition.techName = {
        $regex: techName,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model: TECHSTACK,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
      select: "_id techName",
    });

    return successResponse(res, 200, "Tech stacks fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTechStack = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isTechStackExists = await TECHSTACK.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isTechStackExists) {
      throw new AppError("Tech stack not found for given ID", 404);
    }

    const techStackExists = await TECHSTACK.findOne({
      techName: payload.techName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (techStackExists) {
      throw new AppError("Tech stack with the given name already exists", 409);
    }

    await TECHSTACK.updateOne(
      {
        _id: id,
        isDeleted: false,
      },
      {
        $set: { ...payload },
      },
    );

    return successResponse(res, 200, "Tech stack updated successfully", {
      data: payload.techName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTechStack = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isTechStackExists = await TECHSTACK.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isTechStackExists) {
      throw new AppError("Tech stack not found for given ID", 404);
    }

    isTechStackExists.isDeleted = true;
    isTechStackExists.deletedAt = moment().toDate();

    await isTechStackExists.save();

    return successResponse(res, 200, "Tech stack deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getTechStackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isTechStackExists = await TECHSTACK.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id techName");

    if (!isTechStackExists) {
      throw new AppError("Tech stack not found for given ID", 404);
    }

    return successResponse(res, 200, "Tech stack fetched successfully", {
      data: isTechStackExists,
    });
  } catch (error) {
    next(error);
  }
};

const { EVALUATIONCRITERIA } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");

//==================== ADD CRITERIA ====================
exports.createCriteria = async (req, res, next) => {
  try {
    const { criteria } = req.body;

    // check evaluation criateria duplicate
    const isCriateriaExists = await EVALUATIONCRITERIA.findOne({
      criteria: { $regex: `^${criteria}$`, $options: "i" },
      isDeleted: false,
    });

    if (isCriateriaExists) {
      throw new AppError("Evaluation Criteria already exists", 409);
    }

    await EVALUATIONCRITERIA.create({ criteria });

    return successResponse(res, 201, "Criteria created successfully");
  } catch (err) {
    next(err);
  }
};

//==================== GET CRITERIA ====================
exports.getCriteria = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;

    const _where = {
      isDeleted: false,
    };

    // search evaluation criteria
    if (search) {
      _where.criteria = { $regex: search, $options: "i" };
    }

    const { data, pagination } = await paginate({
      model: EVALUATIONCRITERIA,
      query: _where,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Criteria fetched successfully", {
      data,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

//==================== DELETE CRITERIA ====================
exports.deleteCriteria = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isCriateriaExists = await EVALUATIONCRITERIA.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isCriateriaExists) {
      throw new AppError("Evaluation Criteria not found with given ID", 404);
    }

    await EVALUATIONCRITERIA.updateOne(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );

    return successResponse(res, 200, "Criteria deleted successfully");
  } catch (err) {
    next(err);
  }
};

const { DRSFACTOR } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");

//==================== CREATE DRS FACTOR CRIATERIA ====================
exports.createDrsFactor = async (req, res, next) => {
  try {
    const { criteria } = req.body;

    // check drs criateria duplicate
    const isCriateriaExists = await DRSFACTOR.findOne({
      criteria: { $regex: `^${criteria}$`, $options: "i" },
      isDeleted: false,
    });

    if (isCriateriaExists) {
      throw new AppError("Drs Criteria already exists", 409);
    }

    await DRSFACTOR.create({ criteria });

    return successResponse(res, 201, "criteria created successfully");
  } catch (err) {
    next(err);
  }
};

//==================== GET DRS FACTOR CRIATERIA ====================
exports.getDrsFactor = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;

    const _where = { isDeleted: false };

    // search drs criteria
    if (search) {
      _where.criteria = { $regex: search, $options: "i" };
    }

    const { data, pagination } = await paginate({
      model: DRSFACTOR,
      query: _where,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "criterias fetched successfully", {
      data,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

//==================== DELETE DRS FACTOR CRIATERIA ====================
exports.deleteDrsFactor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isCriateriaExists = await DRSFACTOR.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isCriateriaExists) {
      throw new AppError("Drs Criteria not found with given Id", 404);
    }

    await DRSFACTOR.updateOne(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );

    return successResponse(res, 200, "criteria deleted successfully");
  } catch (err) {
    next(err);
  }
};

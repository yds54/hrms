const moment = require("moment-timezone");
const { LETTERHEADTYPE } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { TIMEZONES } = require("../utils/enum");

//================ CREATE LETTERHEAD TYPE =================
exports.createLetterheadType = async (req, res, next) => {
  try {
    const { type } = req.body;
    const { _id: userId } = req.user;

    const isLetterheadExists = await LETTERHEADTYPE.findOne({
      type: { $regex: `^${type.trim()}$`, $options: "i" },
      isDeleted: false,
    }).select("_id");
    if (isLetterheadExists) {
      throw new AppError("Letterhead type already exists", 409);
    }

    await LETTERHEADTYPE.create({
      type: type.trim(),
      createdBy: userId,
    });

    return successResponse(res, 201, "Letterhead type Created");
  } catch (error) {
    next(error);
  }
};

//================ DISPLAY LETTERHEAD TYPE =================
exports.getLetterheadType = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const query = { isDeleted: false };

    // search letterhead type
    if (search) {
      query.type = { $regex: search, $options: "i" };
    }

    const { data, pagination } = await paginate({
      model: LETTERHEADTYPE,
      query,
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: "createdBy",
          select: "name",
          match: { isDeleted: false },
          options: { lean: true },
        },
      ],
    });

    return successResponse(res, 200, "Letterhead types fetched", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

//================ UPDATE LETTERHEAD TYPE =================
exports.updateLetterheadType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const isLetterheadExists = await LETTERHEADTYPE.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");
    if (!isLetterheadExists) {
      throw new AppError("Letterhead not found with given Id", 404);
    }

    // during update check whether it exists
    const isLetterheadDuplicate = await LETTERHEADTYPE.findOne({
      _id: { $ne: id },
      type: type.trim(),
      isDeleted: false,
    });
    if (isLetterheadDuplicate) {
      throw new AppError("Letterhead type already exists", 409);
    }

    await LETTERHEADTYPE.updateOne(
      { _id: id, isDeleted: false },
      { $set: { type: type.trim() } },
    );

    return successResponse(res, 200, "Letterhead type updated successfully");
  } catch (error) {
    next(error);
  }
};

//================ DELETE LETTERHEAD TYPE =================
exports.deleteLetterheadType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isLetterheadExists = await LETTERHEADTYPE.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");
    if (!isLetterheadExists) {
      throw new AppError("Letterhead not found with given Id", 404);
    }

    await LETTERHEADTYPE.updateOne(
      { _id: id },
      {
        $set: {
          isDeleted: true,
          deletedAt: moment().tz(TIMEZONES.INDIA).toDate(),
        },
      },
    );

    return successResponse(res, 200, "Letterhead type deleted successfully");
  } catch (error) {
    next(error);
  }
};

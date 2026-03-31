const { DRS } = require("../model/modelIndex");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { AppError } = require("../utils/error");
const { getProjection } = require("../utils/projection");

//======================= ADD DRS =================================
exports.addDrs = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { date, onLeave, done, inProgress } = req.body;

    const selectedDate = new Date(date);

    const isExist = await DRS.findOne({
      user: userId,
      date: selectedDate,
    });

    if (isExist) {
      throw new AppError("DRS already submitted for this date", 409);
    }

    if (!onLeave && !(done || inProgress)) {
      throw new AppError("Either 'done' or 'inProgress' is required", 400);
    }

    const drs = await DRS.create({
      ...req.body,
      date: selectedDate,
      user: userId,
      createdBy: userId,
      updatedBy: userId,
    });

    return successResponse(res, 201, "DRS added successfully", drs);
  } catch (error) {
    next(error);
  }
};

//========================= SHOW DRS ===============================
exports.getDrs = async (req, res, next) => {
  try {
    let { page = 1, limit = 10, month, year } = req.query;
    const { _id: userId } = req.user;

    const currentDate = new Date();

    const selectedMonth = month ? Number(month) - 1 : currentDate.getMonth();
    const selectedYear = year ? Number(year) : currentDate.getFullYear();

    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

    const _where = {
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const { data, pagination } = await paginate({
      model: DRS,
      query: _where,
      page,
      limit,
      sort: { date: -1 },
      select: getProjection(["user", "createdBy"]),
    });

    return successResponse(res, 200, "DRS fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

//======================== EDIT DRS =============================
exports.updateDrs = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { id } = req.params;

    const drs = await DRS.findOne({ _id: id });

    if (!drs) {
      throw new AppError("DRS not found", 404);
    }

    if (drs.user.toString() !== userId.toString()) {
      throw new AppError("Unauthorized", 403);
    }

    Object.assign(drs, req.body, { updatedBy: userId });
    await drs.save();

    return successResponse(res, 200, "DRS updated successfully");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

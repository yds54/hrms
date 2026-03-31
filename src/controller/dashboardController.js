const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { HOLIDAY } = require("../model/modelIndex");
const { getProjection } = require("../utils/projection");

//======================= DISPLAY ALL HOLIDAYS =================================

exports.getHolidays = async (req, res, next) => {
  try {
    let { page = 1, limit = 10, search } = req.query;
    const _where = { isDeleted: false };

    let year, month;

    if (search) {
      [year, month] = search.split("-").map(Number);
    } else {
      const currentDate = new Date();
      year = currentDate.getFullYear();
      month = currentDate.getMonth() + 1;
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    _where.holidayDate = {
      $gte: startDate,
      $lte: endDate,
    };

    const { data, pagination } = await paginate({
      model: HOLIDAY,
      query: _where,
      page,
      limit,
      sort: { holidayDate: -1 },
      select: getProjection(["month", "year"]),
    });

    return successResponse(res, 200, "Holidays fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

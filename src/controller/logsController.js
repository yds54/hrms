const moment = require("moment");
const mongoose = require("mongoose");
const { LOGS } = require("../model/modelIndex");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");

exports.getLogs = async (req, res, next) => {
  try {
    let { startDate, endDate, user, action, page, limit, search } = req.query;

    if (!startDate || !endDate) {
      startDate = moment().startOf("month").format("YYYY-MM-DD");
      endDate = moment().endOf("month").format("YYYY-MM-DD");
    }

    const _whereCondition = {
      createdAt: {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      },
    };

    if (user) {
      _whereCondition.userId = new mongoose.Types.ObjectId(user);
    }

    if (action) {
      _whereCondition.action = action;
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  {
                    "user.name.firstName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "user.name.lastName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    tableName: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
          ]
        : []),
      {
        $project: {
          tableName: 1,
          action: 1,
          oldRecord: 1,
          newRecord: 1,
          changedFields: 1,
          createdAt: 1,
          userId: {
            _id: "$user._id",
            name: {
              firstName: "$user.name.firstName",
              middleName: "$user.name.middleName",
              lastName: "$user.name.lastName",
            },
          },
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: LOGS,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
      pipeline,
    });

    return successResponse(res, 200, "Logs fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

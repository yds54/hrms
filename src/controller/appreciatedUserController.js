const moment = require("moment-timezone");
const { APPRECIATEDUSER } = require("../model/modelIndex");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { AppError } = require("../utils/error");
const { dateSearchQuery } = require("../utils/dateFormat");
const { ROLES } = require("../utils/enum");
const { searchConditions } = require("../utils/searchHelper");

// ================= CREATE APPRECIATED USER ====================
exports.createAppreciation = async (req, res, next) => {
  try {
    const { _id: loggedUserId } = req.user;

    const payload = {
      ...req.body,
      date: moment(req.body.date).toDate(),
      createdBy: loggedUserId,
    };

    await APPRECIATEDUSER.create(payload);

    return successResponse(res, 201, "Appreciation added");
  } catch (err) {
    next(err);
  }
};

// ================= DISPLAY APPRECIATED USER ====================
exports.getAppreciations = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const query = { isDeleted: false };

    const isAdminOrHR =
      req.user.role === ROLES.ADMIN || req.user.role === ROLES.HR;
    if (!isAdminOrHR) {
      query.expiresAt = { $gte: moment().toDate() };
    }

    const pipeline = [
      // USER
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                _id: 1,
                profilePicture: 1,
                fullName: 1,
                "name.firstName": 1,
                "name.middleName": 1,
                "name.lastName": 1,
              },
            },
          ],
        },
      },
      { $unwind: "$user" },
      //  CREATED BY
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
          pipeline: [
            {
              $project: {
                _id: 1,
                "name.firstName": 1,
                "name.middleName": 1,
                "name.lastName": 1,
              },
            },
          ],
        },
      },
      { $unwind: "$createdBy" },
      //  DESIGNATION
      {
        $lookup: {
          from: "designations",
          localField: "designationId",
          foreignField: "_id",
          as: "designation",
          pipeline: [
            {
              $project: {
                _id: 1,
                designationName: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$designation",
          preserveNullAndEmptyArrays: true,
        },
      },
      //  PROJECT
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
          pipeline: [
            {
              $project: {
                _id: 1,
                projectName: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true,
        },
      },

      // SEARCH
      ...(search
        ? (() => {
            const dateQuery = dateSearchQuery("date", search);
            return [
              {
                $match: {
                  $or: [
                    // NAME SEARCH
                    searchConditions(search, "user.fullName"),
                    //  DESIGNATION
                    {
                      "designation.designationName": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    //  PROJECT
                    {
                      "project.projectName": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                    // TITLE
                    {
                      title: { $regex: search, $options: "i" },
                    },
                    // DATE SEARCH
                    ...(dateQuery ? [dateQuery] : []),
                  ],
                },
              },
            ];
          })()
        : []),

      {
        $project: {
          _id: 1,
          user: {
            _id: "$user._id",
            profilePicture: "$user.profilePicture",
            name: {
              firstName: "$user.name.firstName",
              middleName: "$user.name.middleName",
              lastName: "$user.name.lastName",
            },
          },
          designation: {
            _id: "$designation._id",
            name: "$designation.designationName",
          },
          project: {
            _id: "$project._id",
            name: "$project.projectName",
          },
          createdBy: {
            _id: "$createdBy._id",
            name: {
              firstName: "$createdBy.name.firstName",
              middleName: "$createdBy.name.middleName",
              lastName: "$createdBy.name.lastName",
            },
          },
          date: 1,
          title: 1,
          isDeleted: 1,
          deletedAt: 1,
          expiresAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const result = await paginate({
      model: APPRECIATEDUSER,
      query,
      page,
      limit,
      sort: { date: -1 },
      pipeline,
    });

    return successResponse(res, 200, "Fetched successfully", result);
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE APPRECIATED USER ====================
exports.updateAppreciation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAppreciatedUserExists = await APPRECIATEDUSER.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");
    if (!isAppreciatedUserExists) {
      throw new AppError("Appreciation not found with given Id", 404);
    }

    if (req.body.date) {
      req.body.date = moment(req.body.date).toDate();
    }

    await APPRECIATEDUSER.updateOne({ _id: id }, { $set: req.body });

    return successResponse(res, 200, "Appreciation Updated successfully");
  } catch (err) {
    next(err);
  }
};

// ================= DELETE APPRECIATED USER ====================
exports.deleteAppreciation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAppreciatedUserExists = await APPRECIATEDUSER.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");
    if (!isAppreciatedUserExists) {
      throw new AppError("Appreciation not found with given Id", 404);
    }

    await APPRECIATEDUSER.updateOne(
      { _id: id },
      {
        $set: {
          isDeleted: true,
          deletedAt: moment().toDate(),
        },
      },
    );

    return successResponse(res, 200, "Appreciation Deleted successfully");
  } catch (err) {
    next(err);
  }
};

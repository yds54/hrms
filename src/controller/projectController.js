const moment = require("moment");
const mongoose = require("mongoose");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { PROJECTS, TEAMS } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { dateSearchQuery } = require("../utils/dateFormat");
const { PROJECT_STATUS } = require("../utils/enum");

exports.addProject = async (req, res, next) => {
  try {
    const { body } = req;
    const isProjectExists = await PROJECTS.findOne({
      projectName: body.projectName,
      isDeleted: false,
    }).select("_id");

    if (isProjectExists)
      throw new AppError("Project with the given name is already exists", 409);
    body.createdBy = req.user._id;
    await PROJECTS.create(body);

    return successResponse(res, 200, "Project Add sucessfully");
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isProjectExists = await PROJECTS.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isProjectExists)
      throw new AppError("Project not found for given Id", 404);

    const ProjectExists = await PROJECTS.findOne({
      projectName: payload.projectName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (ProjectExists) {
      throw new AppError("Project with given name already exists", 409);
    }

    await PROJECTS.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Project updated successfully", {
      data: payload.projectName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isProjectExists = await PROJECTS.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isProjectExists) {
      throw new AppError("Project not found for given ID", 404);
    }

    const deletedAt = moment().toDate();

    isProjectExists.isDeleted = true;
    isProjectExists.deletedAt = deletedAt;

    await Promise.all([
      isProjectExists.save(),

      TEAMS.updateMany(
        {
          projectId: id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            deletedAt,
          },
        },
      ),
    ]);

    return successResponse(res, 200, "Project deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getAllProjects = async (req, res, next) => {
  try {
    const { query } = req;
    const { page, limit, projectType, projectStatus } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (projectType) _whereCondition.type = projectType;
    if (projectStatus) _whereCondition.status = projectStatus;

    const { data, pagination } = await paginate({
      model: PROJECTS,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "Projects fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await PROJECTS.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "teams",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$project", "$$projectId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "teams",
        },
      },
      {
        $lookup: {
          from: "techstacks",
          localField: "techStackId",
          foreignField: "_id",
          as: "techStacks",
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            pmIds: {
              $reduce: {
                input: "$teams.projectManagers",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$pmIds"] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                designation: 1,
              },
            },
          ],
          as: "projectManagers",
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            tlIds: {
              $reduce: {
                input: "$teams.teamLeaders",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$tlIds"] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                designation: 1,
              },
            },
          ],
          as: "teamLeaders",
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            memberIds: {
              $reduce: {
                input: "$teams.members",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$memberIds"] },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                designation: 1,
              },
            },
          ],
          as: "members",
        },
      },
      {
        $project: {
          projectName: 1,
          status: 1,
          type: 1,
          clientName: 1,
          startDate: 1,
          endDate: 1,
          description: 1,

          techStacks: {
            $map: {
              input: "$techStacks",
              as: "tech",
              in: {
                _id: "$$tech._id",
                techName: "$$tech.techName",
              },
            },
          },

          teamNames: {
            $map: {
              input: "$teams",
              as: "team",
              in: {
                _id: "$$team._id",
                teamName: "$$team.teamName",
              },
            },
          },
          projectManagers: 1,
          teamLeaders: 1,
          members: 1,
        },
      },
    ]);

    if (!data.length) {
      throw new AppError("Project not found for given ID", 404);
    }

    return successResponse(res, 200, "Project fetched successfully", {
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectCountByStatus = async (req, res, next) => {
  try {
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      startDate = moment().startOf("month").format("YYYY-MM-DD");
      endDate = moment().endOf("month").format("YYYY-MM-DD");
    }

    const start = moment(startDate).startOf("day").toDate();
    const end = moment(endDate).endOf("day").toDate();

    const statusData = await PROJECTS.aggregate([
      {
        $match: {
          isDeleted: false,
          startDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const newArrivalCount = await PROJECTS.countDocuments({
      isDeleted: false,
      startDate: {
        $gte: start,
        $lte: end,
      },
    });

    const formattedData = Object.values(PROJECT_STATUS).map((status) => {
      const found = statusData.find((item) => item._id === status);

      return {
        status,
        count: found ? found.count : 0,
      };
    });

    formattedData.push({
      status: "newArrival",
      count: newArrivalCount,
    });

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

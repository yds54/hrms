const { paginate } = require("../utils/pagination");
const mongoose = require("mongoose");
const { USER, TEAMS } = require("../model/modelIndex");
const { successResponse } = require("../utils/sucess");
const { AppError } = require("../utils/error");
const { searchConditions } = require("../utils/searchHelper");
const { ROLES } = require("../utils/enum");
const { dateSearchQuery } = require("../utils/dateFormat");
const { getFileUrl } = require("../utils/fileUrl");

exports.addTeam = async (req, res, next) => {
  try {
    const { body } = req;
    const {
      teamName,
      projectManagers = [],
      teamLeaders = [],
      members = [],
    } = body;

    const isTeamExists = await TEAMS.findOne({
      teamName,
      isDeleted: false,
    }).select("_id");

    if (isTeamExists) {
      throw new AppError("Team with the given name already exists", 409);
    }

    const uniqueUserIds = [
      ...new Set([...projectManagers, ...teamLeaders, ...members]),
    ];

    const users = await USER.find({
      _id: { $in: uniqueUserIds },
      isDeleted: false,
    }).select("_id role");

    const foundUserIdSet = new Set(users.map((user) => user._id.toString()));

    const invalidUserIds = uniqueUserIds.filter(
      (id) => !foundUserIdSet.has(id),
    );

    if (invalidUserIds.length) {
      throw new AppError(
        `Invalid or deleted user IDs: ${invalidUserIds.join(", ")}`,
        404,
      );
    }

    const userRoleMap = Object.fromEntries(
      users.map((user) => [user._id.toString(), user.role]),
    );

    if (
      projectManagers.some((id) => userRoleMap[id] !== ROLES.PROJECT_MANAGER)
    ) {
      throw new AppError(
        "Only users with the project_manager role can be assigned as Project Manager",
        403,
      );
    }
    if (
      teamLeaders.some(
        (id) =>
          ![ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(userRoleMap[id]),
      )
    ) {
      throw new AppError(
        "Only project_manager or team_lead can be assigned as Team Leader",
        403,
      );
    }

    body.createdBy = req.user._id;

    await TEAMS.create(body);

    return successResponse(res, 200, "Team added successfully");
  } catch (error) {
    next(error);
  }
};

exports.updateTeam = async (req, res, next) => {
  try {
    const { params, body: payload } = req;
    const { id } = params;

    const isTeamExists = await TEAMS.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isTeamExists) {
      throw new AppError("Team not found for given Id", 404);
    }

    const teamExists = await TEAMS.findOne({
      teamName: payload.teamName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (teamExists) {
      throw new AppError("Team with given name already exists", 409);
    }

    await TEAMS.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );

    return successResponse(res, 200, "Team updated successfully", {
      data: payload.teamName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isTeamExists = await TEAMS.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isTeamExists) {
      throw new AppError("Team not found for given Id", 404);
    }

    isTeamExists.isDeleted = true;
    isTeamExists.deletedAt = new Date();

    await isTeamExists.save();

    return successResponse(res, 200, "Team deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports.getAllTeams = async (req, res, next) => {
  try {
    const { page, limit, project, search } = req.query;
    const { user } = req;

    const _whereCondition = {
      isDeleted: false,
    };

    if (project) {
      _whereCondition.project = project;
    }

    if (user.role !== ROLES.ADMIN) {
      _whereCondition.$or = [
        { projectManagers: user._id },
        { teamLeaders: user._id },
        { members: user._id },
      ];
    }

    const pipeline = [
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "projectManagers",
          foreignField: "_id",
          as: "projectManagers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "teamLeaders",
          foreignField: "_id",
          as: "teamLeaders",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
        },
      },

      ...(search
        ? (() => {
            const fields = [
              "teamName",

              "project.projectName",
              "project.clientName",

              "projectManagers.name.firstName",
              "projectManagers.name.middleName",
              "projectManagers.name.lastName",

              "teamLeaders.name.firstName",
              "teamLeaders.name.middleName",
              "teamLeaders.name.lastName",

              "members.name.firstName",
              "members.name.middleName",
              "members.name.lastName",
            ];

            const searchWords = search.trim().split(/\s+/);

            return [
              {
                $match: {
                  $and: searchWords.map((word) => ({
                    $or: fields.map((field) => ({
                      [field]: {
                        $regex: word,
                        $options: "i",
                      },
                    })),
                  })),
                },
              },
            ];
          })()
        : []),

      {
        $project: {
          teamName: 1,
          createdAt: 1,

          project: {
            _id: "$project._id",
            projectName: "$project.projectName",
            clientName: "$project.clientName",
          },
          projectManagers: {
            $map: {
              input: "$projectManagers",
              as: "pm",
              in: {
                _id: "$$pm._id",
                name: "$$pm.name",
              },
            },
          },
          teamLeaders: {
            $map: {
              input: "$teamLeaders",
              as: "tl",
              in: {
                _id: "$$tl._id",
                name: "$$tl.name",
              },
            },
          },
          members: {
            $map: {
              input: "$members",
              as: "member",
              in: {
                _id: "$$member._id",
                name: "$$member.name",
              },
            },
          },
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: TEAMS,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
      pipeline,
    });

    return successResponse(res, 200, "Teams fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await TEAMS.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        },
      },

      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$projectManagers" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$ids"] },
                isDeleted: false,
              },
            },
            {
              $lookup: {
                from: "designations",
                localField: "designationId",
                foreignField: "_id",
                as: "designation",
              },
            },
            {
              $unwind: {
                path: "$designation",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                designation: "$designation.designationName",
                "profilePicture.fileName": 1,
              },
            },
          ],
          as: "projectManagers",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$teamLeaders" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$ids"] },
                isDeleted: false,
              },
            },
            {
              $lookup: {
                from: "designations",
                localField: "designationId",
                foreignField: "_id",
                as: "designation",
              },
            },
            {
              $unwind: {
                path: "$designation",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                designation: "$designation.designationName",
                "profilePicture.fileName": 1,
              },
            },
          ],
          as: "teamLeaders",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$members" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$ids"] },
                isDeleted: false,
              },
            },
            {
              $lookup: {
                from: "designations",
                localField: "designationId",
                foreignField: "_id",
                as: "designation",
              },
            },
            {
              $unwind: {
                path: "$designation",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                designation: "$designation.designationName",
                "profilePicture.fileName": 1,
              },
            },
          ],
          as: "members",
        },
      },
      {
        $project: {
          teamName: 1,
          project: {
            _id: "$project._id",
            projectName: "$project.projectName",
          },
          projectManagers: 1,
          teamLeaders: 1,
          members: 1,
        },
      },
    ]);

    if (!data.length) {
      throw new AppError("Team not found for given ID", 404);
    }

    const team = data[0];

    ["projectManagers", "teamLeaders", "members"].forEach((field) => {
      team[field] = team[field].map((user) => ({
        ...user,
        profilePicture: user.profilePicture?.fileName
          ? getFileUrl(
              `profile/${user.profilePicture.fileName}`,
              user.profilePicture.fileName,
            )
          : null,
      }));
    });

    return successResponse(res, 200, "Team fetched successfully", {
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectTeamSummary = async (req, res, next) => {
  try {
    const { page, limit, projectStatus, projectType, search } = req.query;
    const { user } = req;

    const teamMatch = {
      isDeleted: false,
    };

    if (user.role !== ROLES.ADMIN) {
      teamMatch.$or = [
        { projectManagers: user._id },
        { teamLeaders: user._id },
        { members: user._id },
      ];
    }

    const projectMatch = {
      isDeleted: false,
    };

    if (projectStatus) projectMatch.status = projectStatus;
    if (projectType) projectMatch.type = projectType;

    const startDateSearch = dateSearchQuery("project.startDate", search);
    const endDateSearch = dateSearchQuery("project.endDate", search);

    const pipeline = [
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: "$project",
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$projectManagers" },

          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$ids"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
              },
            },
          ],
          as: "projectManagers",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$teamLeaders" },

          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$ids"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
              },
            },
          ],
          as: "teamLeaders",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ids: "$members" },

          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$ids"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
              },
            },
          ],
          as: "members",
        },
      },
      {
        $match: {
          "project.isDeleted": false,

          ...Object.entries(projectMatch).reduce((acc, [key, value]) => {
            acc[`project.${key}`] = value;
            return acc;
          }, {}),
          ...(search
            ? (() => {
                const fields = [
                  "project.projectName",
                  "project.clientName",
                  "project.status",
                  "project.type",

                  "projectManagers.name.firstName",
                  "projectManagers.name.middleName",
                  "projectManagers.name.lastName",

                  "teamLeaders.name.firstName",
                  "teamLeaders.name.middleName",
                  "teamLeaders.name.lastName",

                  "members.name.firstName",
                  "members.name.middleName",
                  "members.name.lastName",
                ];

                const searchWords = search.trim().split(/\s+/);

                return {
                  $and: [
                    ...searchWords.map((word) => ({
                      $or: [
                        ...fields.map((field) => ({
                          [field]: {
                            $regex: word,
                            $options: "i",
                          },
                        })),

                        ...(startDateSearch ? [startDateSearch] : []),
                        ...(endDateSearch ? [endDateSearch] : []),
                      ],
                    })),
                  ],
                };
              })()
            : {}),
        },
      },

      {
        $group: {
          _id: "$project._id",
          projectName: {
            $first: "$project.projectName",
          },
          clientName: {
            $first: "$project.clientName",
          },
          startDate: {
            $first: "$project.startDate",
          },
          endDate: {
            $first: "$project.endDate",
          },
          status: {
            $first: "$project.status",
          },
          type: {
            $first: "$project.type",
          },
          projectManagers: {
            $push: "$projectManagers",
          },
          teamLeaders: {
            $push: "$teamLeaders",
          },
          members: {
            $push: "$members",
          },
        },
      },
      {
        $project: {
          projectName: 1,
          clientName: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          type: 1,

          projectManagers: {
            $reduce: {
              input: "$projectManagers",
              initialValue: [],
              in: {
                $setUnion: ["$$value", "$$this"],
              },
            },
          },
          teamLeaders: {
            $reduce: {
              input: "$teamLeaders",
              initialValue: [],
              in: {
                $setUnion: ["$$value", "$$this"],
              },
            },
          },
          members: {
            $reduce: {
              input: "$members",
              initialValue: [],
              in: {
                $setUnion: ["$$value", "$$this"],
              },
            },
          },
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: TEAMS,
      query: teamMatch,
      page: +page,
      limit: +limit,
      pipeline,
    });

    return successResponse(
      res,
      200,
      "Project team summary fetched successfully",
      {
        data,
        pagination,
      },
    );
  } catch (error) {
    next(error);
  }
};

exports.removeTeamMember = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;

    const team = await TEAMS.findOne({
      _id: teamId,
      isDeleted: false,
    });

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    const isPM = team.projectManagers.some((id) => id.toString() === userId);
    const isTL = team.teamLeaders.some((id) => id.toString() === userId);
    const isMember = team.members.some((id) => id.toString() === userId);

    if (!isPM && !isTL && !isMember) {
      throw new AppError("User is not assigned to this team", 404);
    }
    if (isPM && team.projectManagers.length === 1) {
      throw new AppError(
        "Cannot remove the last remaining Project Manager from the team",
        400,
      );
    }
    if (isMember && team.members.length === 1) {
      throw new AppError(
        "Cannot remove the last remaining Team Member from the team",
        400,
      );
    }

    await TEAMS.updateOne(
      { _id: teamId },
      {
        $pull: {
          projectManagers: userId,
          teamLeaders: userId,
          members: userId,
        },
      },
    );

    return successResponse(res, 200, "Member removed from team successfully");
  } catch (error) {
    next(error);
  }
};

exports.getUnassignedUsers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;

    const pipeline = [
      {
        $lookup: {
          from: "teams",
          pipeline: [
            {
              $match: {
                isDeleted: false,
              },
            },
            {
              $project: {
                assignedUsers: {
                  $setUnion: ["$projectManagers", "$teamLeaders", "$members"],
                },
              },
            },
            {
              $unwind: "$assignedUsers",
            },
            {
              $group: {
                _id: null,
                assignedUserIds: {
                  $addToSet: "$assignedUsers",
                },
              },
            },
          ],
          as: "assignedData",
        },
      },
      {
        $match: {
          isDeleted: false,
          isLeft: false,
          role: {
            $nin: [ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER],
          },
          $expr: {
            $not: {
              $in: [
                "$_id",
                {
                  $ifNull: [
                    {
                      $arrayElemAt: ["$assignedData.assignedUserIds", 0],
                    },
                    [],
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "designations",
          localField: "designationId",
          foreignField: "_id",
          as: "designation",
        },
      },
      {
        $unwind: {
          path: "$designation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },

      ...(search
        ? (() => {
            const fields = [
              "name.firstName",
              "name.middleName",
              "name.lastName",
              "employeeCode",
              "role",
              "designation.designationName",
              "department.departmentName",
            ];

            const searchWords = search.trim().split(/\s+/);
            return [
              {
                $match: {
                  $and: searchWords.map((word) => ({
                    $or: fields.map((field) => ({
                      [field]: {
                        $regex: word,
                        $options: "i",
                      },
                    })),
                  })),
                },
              },
            ];
          })()
        : []),

      {
        $project: {
          employeeCode: 1,
          name: 1,
          role: 1,
          isLeft: 1,
          profilePicture: {
            fileName: "$profilePicture.fileName",
          },
          designation: {
            _id: "$designation._id",
            designationName: "$designation.designationName",
          },
          department: {
            _id: "$department._id",
            departmentName: "$department.departmentName",
          },
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: USER,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
      pipeline,
    });

    data.forEach((user) => {
      user.profilePicture = user.profilePicture?.fileName
        ? getFileUrl(
            `profile/${user.profilePicture.fileName}`,
            user.profilePicture.fileName,
          )
        : null;
    });

    return successResponse(res, 200, "Unassigned users fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const teams = await TEAMS.find({
      isDeleted: false,
      $or: [
        { projectManagers: userId },
        { teamLeaders: userId },
        { members: userId },
      ],
    })
      .populate("project", "projectName")
      .select("project");

    const projects = teams.map((team) => team.project);

    return successResponse(res, 200, "Projects fetched successfully", {
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTeamMembers = async (req, res, next) => {
  try {
    const { user, query } = req;
    const { search } = query;

    const pipeline = [
      {
        $match: {
          isDeleted: false,
          projectManagers: user._id,
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            memberIds: {
              $setUnion: ["$members"],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$memberIds"],
                },
                isDeleted: false,
                role: {
                  $ne: ROLES.PROJECT_MANAGER,
                },
              },
            },
          ],
          as: "teamMembers",
        },
      },

      {
        $unwind: {
          path: "$teamMembers",
          preserveNullAndEmptyArrays: false,
        },
      },
      ...(search
        ? (() => {
            return [
              {
                $match: {
                  $or: [
                    searchConditions(search, "teamMembers.fullName"),

                    {
                      "teamMembers.employeeCode": {
                        $regex: search,
                        $options: "i",
                      },
                    },
                  ],
                },
              },
            ];
          })()
        : []),
      {
        $group: {
          _id: "$teamMembers._id",

          employeeCode: {
            $first: "$teamMembers.employeeCode",
          },

          Name: {
            $first: "$teamMembers.name",
          },
        },
      },

      {
        $sort: {
          fullName: 1,
        },
      },
    ];
    const teamMembers = await TEAMS.aggregate(pipeline);

    return successResponse(res, 200, "Team members fetched successfully", {
      data: teamMembers,
    });
  } catch (error) {
    next(error);
  }
};

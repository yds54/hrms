const mongoose = require("mongoose");
const {
  EVALUATIONREPORT,
  EVALUATIONCRITERIA,
  TEAMS,
  USER,
} = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { ROLES } = require("../utils/enum");
const { getMonthRange } = require("../utils/dateFormat");

//========================= CREATE EVALIATION REPORT ==========================
exports.createEvaluationReport = async (req, res, next) => {
  try {
    const { _id: evaluatedBy, role } = req.user;
    const { userId, criteria } = req.body;

    const isUserExists = await USER.findOne({
      _id: userId,
      isDeleted: false,
    }).select("_id");
    if (!isUserExists) {
      throw new AppError("User not found with given Id", 404);
    }

    if (role === ROLES.PROJECT_MANAGER) {
      const isMemberExists = await TEAMS.findOne({
        projectManagers: evaluatedBy,
        members: userId,
        isDeleted: false,
      }).select("_id");
      if (!isMemberExists) {
        throw new AppError(
          "You are not authorized, user is not part of your team.",
          403,
        );
      }
    }

    const criteriaIds = criteria.map((c) => c.criteriaId);
    const validCriteriaCount = await EVALUATIONCRITERIA.countDocuments({
      _id: { $in: criteriaIds },
      isDeleted: false,
    });
    if (validCriteriaCount !== criteria.length) {
      throw new AppError("Invalid criteria", 400);
    }

    await EVALUATIONREPORT.create({
      ...req.body,
      evaluatedBy,
    });
    return successResponse(res, 201, "Evaluation created");
  } catch (err) {
    next(err);
  }
};

//========================= GET EVALUATION REPORT ==========================
exports.getEvaluationReport = async (req, res, next) => {
  try {
    const { role, _id: loggedInUser } = req.user;
    const { month, year, userId } = req.query;
    const query = { isDeleted: false };

    if (month && year) {
      const { startOfMonth, endOfMonth } = getMonthRange(
        Number(year),
        Number(month),
      );
      query.fromDate = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    // ================= ROLE WISE DISPLAY =================
    if (role === ROLES.USER) {
      query.userId = loggedInUser;
    } else if (role === ROLES.PROJECT_MANAGER) {
      const teams = await TEAMS.find({
        projectManagers: loggedInUser,
        isDeleted: false,
      }).select("members");

      const memberIds = teams.flatMap((t) =>
        t.members.map((id) => id.toString()),
      );

      if (userId && !memberIds.includes(userId)) {
        throw new AppError("User is not part of your team", 403);
      }

      query.userId = userId
        ? new mongoose.Types.ObjectId(userId)
        : {
            $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)),
          };
    } else if ([ROLES.ADMIN, ROLES.HR].includes(role)) {
      if (userId) query.userId = new mongoose.Types.ObjectId(userId);
    } else {
      throw new AppError("You are not authorized to access this resource", 403);
    }

    const reports = await EVALUATIONREPORT.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: "$userId" },
      {
        $lookup: {
          from: "users",
          localField: "evaluatedBy",
          foreignField: "_id",
          as: "evaluatedBy",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: "$evaluatedBy" },
      {
        $lookup: {
          from: "evaluationcriterias",
          localField: "criteria.criteriaId",
          foreignField: "_id",
          as: "criteriaData",
          pipeline: [{ $project: { criteria: 1 } }],
        },
      },
      {
        $addFields: {
          criteria: {
            $map: {
              input: "$criteria",
              as: "c",
              in: {
                criteria: {
                  $let: {
                    vars: {
                      match: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$criteriaData",
                              as: "cd",
                              cond: { $eq: ["$$cd._id", "$$c.criteriaId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$match.criteria",
                  },
                },
                score: "$$c.score",
              },
            },
          },
        },
      },
      {
        $project: {
          criteriaData: 0,
        },
      },
    ]);

    // Hide Private note for user
    const result =
      role === ROLES.USER
        ? reports.map((r) => {
            delete r.privateNote;
            return r;
          })
        : reports;

    return successResponse(res, 200, "Evaluation fetched", { reports: result });
  } catch (err) {
    next(err);
  }
};

//========================= UPDATE EVALUATION REPORT ==========================
exports.updateEvaluationReport = async (req, res, next) => {
  try {
    const { _id: evaluatedBy, role } = req.user;
    const { id } = req.params;
    const { criteria } = req.body;

    const isReportExists = await EVALUATIONREPORT.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id userId");
    if (!isReportExists) {
      throw new AppError("Evaluation report not found with given Id", 404);
    }

    if (role === ROLES.PROJECT_MANAGER) {
      const isMemberExists = await TEAMS.findOne({
        projectManagers: evaluatedBy,
        members: isReportExists.userId,
        isDeleted: false,
      }).select("_id");
      if (!isMemberExists) {
        throw new AppError(
          "You are not authorized, user is not part of your team.",
          403,
        );
      }
    }

    if (criteria) {
      const criteriaIds = criteria.map((c) => c.criteriaId);
      const validCriteriaCount = await EVALUATIONCRITERIA.countDocuments({
        _id: { $in: criteriaIds },
        isDeleted: false,
      });
      if (validCriteriaCount !== criteria.length) {
        throw new AppError("Invalid criteria", 500);
      }
    }

    const payload = { ...req.body, evaluatedBy };
    await EVALUATIONREPORT.updateOne({ _id: id }, { $set: payload });
    return successResponse(res, 200, "Evaluation updated");
  } catch (err) {
    next(err);
  }
};

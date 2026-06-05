const mongoose = require("mongoose");
const moment = require("moment-timezone");
const {
  DRSMONTHLYREPORT,
  DRS,
  DRSFACTOR,
  TEAMS,
  USER,
} = require("../model/modelIndex");
const { successResponse } = require("../utils/sucess");
const { AppError } = require("../utils/error");
const { getMonthRange } = require("../utils/dateFormat");
const { ROLES, TIMEZONES, USER_STATUS } = require("../utils/enum");

//============== CERATE AND UPDATE DRS MONTHLY REPORT TARGET ==========================
exports.upsertMonthlyReport = async (req, res, next) => {
  try {
    const { _id: loggedInUser, role } = req.user;
    const {
      user,
      month,
      workingDays,
      workingHours,
      monthlyReport = [],
    } = req.body;

    if (
      role === ROLES.PROJECT_MANAGER &&
      user.toString() === loggedInUser.toString()
    ) {
      throw new AppError(
        "Project Manager cannot create or update their own monthly report",
        403,
      );
    }

    if ([ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(role)) {
      const _where = {
        members: user,
        isDeleted: false,
      };

      if (role === ROLES.PROJECT_MANAGER) {
        _where.projectManagers = loggedInUser;
      } else {
        _where.teamLeaders = loggedInUser;
      }

      const isMemberExists = await TEAMS.findOne(_where).select("_id");
      if (!isMemberExists) {
        throw new AppError(
          "You are not authorized to set target for this user",
          403,
        );
      }
    }

    // get drs factor criteria
    const drsFactorCriteria = await DRSFACTOR.find({
      isDeleted: false,
    }).select("criteria");

    const allowedFactors = new Set(drsFactorCriteria.map((f) => f.criteria));
    for (const item of monthlyReport) {
      if (!allowedFactors.has(item.factor)) {
        throw new AppError(`${item.factor} is not valid factor`, 400);
      }
    }

    const inputMap = new Map(
      monthlyReport.map((item) => [item.factor, item.target]),
    );
    const finalMonthlyReport = drsFactorCriteria.map((f) => ({
      factor: f.criteria,
      target: inputMap.get(f.criteria) || 0,
    }));

    //=========== UPSERT TARGET =====================
    let report = await DRSMONTHLYREPORT.findOne({
      user,
      month,
      isDeleted: false,
    });

    if (report) {
      report.set({
        workingDays,
        workingHours,
        monthlyReport: finalMonthlyReport,
      });
      report = await report.save();
    } else {
      report = await DRSMONTHLYREPORT.create({
        user,
        month,
        workingDays,
        workingHours,
        monthlyReport: finalMonthlyReport,
        createdBy: loggedInUser,
      });
    }

    return successResponse(
      res,
      200,
      "Monthly report saved successfully",
      report,
    );
  } catch (err) {
    next(err);
  }
};

//============== DISPLAY DRS MONTHLY REPORT ==========================
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { _id: loggedInUser, role } = req.user;
    const { userId } = req.params;
    let { month } = req.query;

    if (role === ROLES.USER && userId !== loggedInUser.toString()) {
      throw new AppError("You are not authorized to access this resource", 403);
    }

    if ([ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD].includes(role)) {
      const isOwnReport = userId === loggedInUser.toString();
      if (!(role === ROLES.PROJECT_MANAGER && isOwnReport)) {
        const _where = {
          members: userId,
          isDeleted: false,
        };

        if (role === ROLES.PROJECT_MANAGER) {
          _where.projectManagers = loggedInUser;
        } else {
          _where.teamLeaders = loggedInUser;
        }

        const isMemberExists = await TEAMS.findOne(_where).select("_id");
        if (!isMemberExists) {
          throw new AppError(
            "You are not authorized to access this user's report",
            403,
          );
        }
      }
    }

    // default current month
    if (!month) {
      month = moment.tz(TIMEZONES.INDIA).format("YYYY-MM");
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const { startOfMonth, endOfMonth } = getMonthRange(year, monthNumber);

    const report = await DRSMONTHLYREPORT.findOne({
      user: userId,
      month,
      isDeleted: false,
    }).lean();

    const workingDays = report?.workingDays || 0;
    const workingHours = report?.workingHours || 0;
    const monthlyReport = report?.monthlyReport || [];

    const aggregatedDRS = await DRS.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $project: { factors: { $objectToArray: "$factors" } } },
      { $unwind: "$factors" },
      {
        $group: {
          _id: "$factors.k",
          total: { $sum: "$factors.v" },
        },
      },
    ]);

    const actualMap = new Map(
      aggregatedDRS.map(({ _id, total }) => [_id, total]),
    );

    let totalTarget = 0;
    let totalActual = 0;

    const data = monthlyReport.map(({ factor, target }) => {
      const actual = actualMap.get(factor) || 0;
      totalTarget += target;
      totalActual += actual;
      let productivityRatio = 0;
      let plusMinusTarget = 0;

      if (target > 0) {
        productivityRatio = Number((actual / target).toFixed(2));
        plusMinusTarget = actual - target;
      }

      return {
        factor,
        target,
        actual,
        productivityRatio,
        plusMinusTarget,
      };
    });

    // check valid target exists
    const hasValidTarget = totalTarget > 0;

    const overall = {
      target: totalTarget,
      actual: totalActual,
      plusMinusTarget: hasValidTarget ? totalActual - totalTarget : 0,
      productivityRatio: hasValidTarget
        ? Number((totalActual / totalTarget).toFixed(2))
        : 0,
    };

    const productivity = hasValidTarget
      ? Number(((totalActual / totalTarget) * 100).toFixed(2))
      : 0;

    return successResponse(res, 200, "Monthly report fetched", {
      workingDays,
      workingHours,
      overall,
      productivity,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ================= DISPLAY ORGANIZATION DRS REPORT =================
exports.getOrganizationDRSReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;

    const startOfDate = moment
      .tz(fromDate, TIMEZONES.INDIA)
      .startOf("day")
      .toDate();
    const endOfDate = moment.tz(toDate, TIMEZONES.INDIA).endOf("day").toDate();

    const users = await USER.find({
      drsRequired: true,
      isDeleted: false,
      isLeft: false,
      status: USER_STATUS.ACTIVE,
    }).select("_id");
    const userIds = users.map((u) => u._id);

    // get valid factor
    const drsFactors = await DRSFACTOR.find({
      isDeleted: false,
    }).select("criteria");
    const factorList = drsFactors.map((f) => f.criteria);

    if (!userIds.length) {
      return successResponse(res, 200, "No users found", {
        aggregatedDRS: factorList.map((factor) => ({
          factor,
          total: 0,
        })),
      });
    }

    const aggregated = await DRS.aggregate([
      {
        $match: {
          user: { $in: userIds },
          isDeleted: false,
          date: { $gte: startOfDate, $lte: endOfDate },
        },
      },
      { $project: { factors: { $objectToArray: "$factors" } } },
      { $unwind: "$factors" },
      {
        $group: {
          _id: "$factors.k",
          total: { $sum: "$factors.v" },
        },
      },
    ]);

    const aggregatedMap = new Map(
      aggregated.map((item) => [item._id, item.total]),
    );

    const finalData = factorList.map((factor) => ({
      factor,
      total: aggregatedMap.get(factor) || 0,
    }));

    return successResponse(res, 200, "Orgabization DRS analytics fetched", {
      aggregatedDRS: finalData,
    });
  } catch (err) {
    next(err);
  }
};

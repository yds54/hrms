const { Joi } = require("express-validation");
const {
  LEAVE_DAY_TYPE,
  LEAVE_DURATION,
  LEAVE_REASON_TYPE,
  LEAVE_STATUS,
} = require("../utils/enum");

const timeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)\s(AM|PM)$/;

//======================= SEND LEAVE REQUEST VALIDATION =================================
exports.createLeaveValidation = {
  body: Joi.object({
    reasonType: Joi.string()
      .valid(...Object.values(LEAVE_REASON_TYPE))
      .required(),

    reason: Joi.string().trim().required(),

    numberOfDays: Joi.string()
      .valid(...Object.values(LEAVE_DAY_TYPE))
      .required(),

    date: Joi.date().optional(),

    isFullDay: Joi.boolean().optional(),

    fromTime: Joi.string().pattern(timeRegex).required(),
    toTime: Joi.string().pattern(timeRegex).required(),

    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),

    totalDays: Joi.number().optional(),

    declineReason: Joi.string().allow("", null),
  }).custom((value, helpers) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (value.numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
      if (!value.date) {
        return helpers.message("Date is required for Single Day leave");
      }
      const inputDate = new Date(value.date);
      inputDate.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        return helpers.message("Past date is not allowed");
      }
    }

    if (value.numberOfDays === LEAVE_DAY_TYPE.MULTIPLE) {
      if (
        !value.fromDate ||
        !value.toDate ||
        !value.fromTime ||
        !value.toTime
      ) {
        return helpers.message(
          "fromDate and toDate and Time required for Multiple Day leave",
        );
      }
      const fromdate = new Date(value.fromDate);
      const todate = new Date(value.toDate);
      if (fromdate < today) {
        return helpers.message("Past date is not allowed");
      }
      if (todate < fromdate) {
        return helpers.message("Invalid date range");
      }
    }
    return value;
  }),
};

//===================== LEAVE REQUEST HISTORY VALIDATION ============================
exports.getLeaveHistoryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).required(),
    limit: Joi.number().integer().min(1).max(100).default(10).required(),

    year: Joi.number()
      .integer()
      .min(2000)
      .max(new Date().getFullYear())
      .optional(),

    filter: Joi.string()
      .valid(
        "All",
        ...Object.values(LEAVE_DAY_TYPE),
        LEAVE_DURATION.HALF,
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      )
      .optional(),

    search: Joi.string().optional(),
    pmFilter: Joi.string()
      .optional()
      .valid(...Object.values(LEAVE_STATUS)),
    hrFilter: Joi.string()
      .optional()
      .valid(...Object.values(LEAVE_STATUS)),
  }),
};

//===================== LEAVE REQUEST UPDATE VALIDATION ==============================
exports.updateLeaveValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    isPMApproved: Joi.string()
      .valid(...Object.values(LEAVE_STATUS))
      .optional(),
    isHRApproved: Joi.string()
      .valid(...Object.values(LEAVE_STATUS))
      .optional(),
    declineReason: Joi.string().allow("").optional(),
  }),
};

//===================== DELETE LEAVE REQUEST VALIDATION ==========================
exports.deleteLeaveValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
};

//===================== DISPLAY TEAM LEAVE REQUEST VALIDATION ==========================
exports.teamLeaveRequestValidation = {
  query: Joi.object({
    page: Joi.number().required(),
    limit: Joi.number().required(),
    search: Joi.string().allow("").optional(),
    filter: Joi.string().allow("").optional(),
    year: Joi.number().optional(),
    pmFilter: Joi.string().allow("").optional(),
    hrFilter: Joi.string().allow("").optional(),
  }),
};

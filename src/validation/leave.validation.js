const { Joi } = require("express-validation");
const { LEAVE_DAY_TYPE, LEAVE_DURATION } = require("../utils/enum");

//======================= SEND LEAVE REQUEST VALIDATION =================================
exports.createLeaveValidation = {
  body: Joi.object({
    reason: Joi.string().trim().required(),

    numberOfDays: Joi.string()
      .valid(...Object.values(LEAVE_DAY_TYPE))
      .required(),

    date: Joi.date().optional(),

    fullHalfDay: Joi.string()
      .valid(...Object.values(LEAVE_DURATION))
      .optional(),

    fromTime: Joi.string().optional(),
    toTime: Joi.string().optional(),

    fromDateTime: Joi.date().optional(),
    toDateTime: Joi.date().optional(),

    totalDays: Joi.number().optional(),

    declineReason: Joi.string().allow("", null),
  }).custom((value, helpers) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    //  single day validation required
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

    // multiple day validation - required
    if (value.numberOfDays === LEAVE_DAY_TYPE.MULTIPLE) {
      if (!value.fromDateTime || !value.toDateTime) {
        return helpers.message(
          "fromDateTime and toDateTime required for Multiple Day leave",
        );
      }

      const from = new Date(value.fromDateTime);
      const to = new Date(value.toDateTime);

      if (from < today) {
        return helpers.message("Past date is not allowed");
      }

      if (to < from) {
        return helpers.message("Invalid date range");
      }
    }

    return value;
  }),
};

//===================== LEAVE REQUEST HISTORY VALIDATION ============================
exports.getLeaveHistoryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(100).default(10),

    year: Joi.number()
      .integer()
      .min(2000)
      .max(new Date().getFullYear())
      .optional(),

    filter: Joi.string()
      .valid(
        "All",
        ...Object.values(LEAVE_DAY_TYPE), // Single Day, Multiple Day
        LEAVE_DURATION.HALF, // Half Day
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
  }),
};

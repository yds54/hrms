const { Joi } = require("express-validation");

//====================== ADD DRS VALIDATION ==========================
exports.drsValidation = {
  body: Joi.object({
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .custom((value, helpers) => {
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(value);
        // check valid date
        if (
          date.getFullYear() !== year ||
          date.getMonth() + 1 !== month ||
          date.getDate() !== day
        ) {
          return helpers.message("Invalid date");
        }

        // error in futur date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(date);
        inputDate.setHours(0, 0, 0, 0);
        if (inputDate > today) {
          return helpers.message("Future date is not allowed");
        }
        return value;
      })
      .messages({
        "string.pattern.base": "Date must be in YYYY-MM-DD format",
      }),

    billableHours: Joi.number().min(0).max(24).default(0),
    nonBillableHours: Joi.number().min(0).max(24).default(0),

    projectsWorkedOn: Joi.number().min(0).default(0),
    estimationsGiven: Joi.number().min(0).default(0),

    interviewsGiven: Joi.number().min(0).default(0),
    interviewsCracked: Joi.number().min(0).default(0),

    bugSolvingHours: Joi.number().min(0).max(24).default(0),
    meetingsAttended: Joi.number().min(0).default(0),

    onLeave: Joi.boolean().default(false),

    notes: Joi.string().allow("", null),
    done: Joi.string().allow("", null),
    inProgress: Joi.string().allow("", null),
    nextPlan: Joi.string().allow("", null),
  }).custom((value, helpers) => {
    const isOnLeave = value.onLeave;
    const hasWorkData = value.done || value.inProgress;

    if (!isOnLeave && !hasWorkData) {
      return helpers.message(
        "Either 'done' or 'inProgress' is required when not on leave",
      );
    }

    return value;
  }),
};

// ================== DISPLAY AND FILTER DRS VALIDATION ==================
exports.getDrsValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).required(),
    limit: Joi.number().integer().min(1).max(100).default(10).required(),
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2000).max(2100).optional(),
    search: Joi.string().optional(),
  }),
};

//===================== EDIT DRS VALIDATION ====================
exports.updateDrsValidation = {
  params: Joi.object({
    id: Joi.string().required().messages({
      "any.required": "DRS id is required",
    }),
  }),

  body: Joi.object({
    billableHours: Joi.number().min(0).max(24),
    nonBillableHours: Joi.number().min(0).max(24),

    projectsWorkedOn: Joi.number().min(0),
    estimationsGiven: Joi.number().min(0),

    interviewsGiven: Joi.number().min(0),
    interviewsCracked: Joi.number().min(0),

    bugSolvingHours: Joi.number().min(0).max(24),
    meetingsAttended: Joi.number().min(0),

    onLeave: Joi.boolean(),

    notes: Joi.string().allow("", null),
    done: Joi.string().allow("", null),
    inProgress: Joi.string().allow("", null),
    nextPlan: Joi.string().allow("", null),
  })
    .min(1)
    .custom((value, helpers) => {
      const isOnLeave = value.onLeave;
      const hasWorkData =
        value.done !== undefined || value.inProgress !== undefined;

      if (isOnLeave === false || isOnLeave === undefined) {
        if (!hasWorkData) {
          return helpers.message(
            "Either 'done' or 'inProgress' is required when not on leave",
          );
        }
      }

      return value;
    }),
};

const { Joi } = require("express-validation");

//============== CERATE AND UPDATE DRS MONTHLY REPORT TARGET VALIDATION ==========================
exports.createMonthlyReportValidation = {
  body: Joi.object({
    userId: Joi.string().required(),
    month: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required()
      .messages({
        "string.pattern.base": "Month must be in YYYY-MM format",
      }),
    workingDays: Joi.number().min(0).optional(),
    workingHours: Joi.number().min(0).optional(),
    monthlyReport: Joi.array()
      .items(
        Joi.object({
          factor: Joi.string().required(),
          target: Joi.number().min(0).required(),
        }),
      )
      .min(1)
      .optional(),
  }),
};

//============== DISPLAY DRS MONTHLY REPORT ==========================
exports.getMonthlyReportValidation = {
  params: Joi.object({
    userId: Joi.string().required(),
  }),
  query: Joi.object({
    month: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .optional(),
  }),
};

// ================= DISPLAY ALL EMPLOYEE DRS REPORT VALIDATION =================
exports.getOrganizationDRSReportValidation = {
  query: Joi.object({
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
  }),
};

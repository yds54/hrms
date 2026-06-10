const { Joi } = require("express-validation");

//========================= CREATE AND UPDATEEVALIATION REPORT VALIDATION ==========================
exports.createEvaluationReportValidation = {
  body: Joi.object({
    userId: Joi.string().required(),
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
    criteria: Joi.array()
      .items(
        Joi.object({
          criteriaId: Joi.string().required(),
          score: Joi.number().min(0).max(10).required(),
        }),
      )
      .min(1)
      .optional(),
    weeklyAverage: Joi.number().optional(),
    publicNote: Joi.string().allow(null).optional(),
    privateNote: Joi.string().allow(null).optional(),
  }),
};
//========================= GET EVALUATION REPORT VALIDATION ==========================
exports.getEvaluationReportValidation = {
  query: Joi.object({
    month: Joi.number().min(1).max(12).optional(),
    year: Joi.number().min(2000).max(2100).optional(),
    userId: Joi.string().optional(),
  }),
};

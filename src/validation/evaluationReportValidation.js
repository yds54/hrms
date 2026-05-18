const { Joi } = require("express-validation");

//========================= CREATE EVALIATION REPORT VALIDATION ==========================
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
      .required(),
    weeklyAverage: Joi.number().optional(),
    publicNote: Joi.string().allow(null),
    privateNote: Joi.string().allow(null),
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

//========================= UPDATE EVALUATION REPORT VALIDATION ==========================
exports.updateEvaluationReportValidation = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
    criteria: Joi.array()
      .items(
        Joi.object({
          criteriaId: Joi.string().required(),
          score: Joi.number().min(0).max(10).required(),
        }),
      )
      .optional(),
    weeklyAverage: Joi.number().optional(),
    publicNote: Joi.string().allow(null),
    privateNote: Joi.string().allow(null),
  }),
};

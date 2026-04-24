const { Joi } = require("express-validation");

exports.addPayrollValidation = {
  body: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    stipendAmount: Joi.number().min(0).optional(),
    salaryAmount: Joi.number().min(0).required(),
    incrementType: Joi.string().valid("monthly", "yearly").required(),
    trainingStartDate: Joi.date().optional().allow(null),
    trainingDurationInMonths: Joi.number().min(0).optional().allow(null),
    trainingEndDate: Joi.date().optional().allow(null),
    joiningDate: Joi.date().required(),
    isBond: Joi.boolean().required(),
    bondDurationInMonths: Joi.number().min(0).required(),
    bondCompletedDate: Joi.date().optional().required(),
    nda: Joi.boolean().required(),
    ctcTemplate: Joi.string().hex().length(24).optional().allow(null, ""),
    remark: Joi.string().optional().allow("", null),
  }),
};

exports.updatePayrollValidation = {
  body: Joi.object({
    userId: Joi.string().hex().length(24),
    stipendAmount: Joi.number().min(0).optional(),
    salaryAmount: Joi.number().min(0).required(),
    incrementType: Joi.string().valid("monthly", "yearly").required(),
    trainingStartDate: Joi.date().optional().allow(null),
    trainingDurationInMonths: Joi.number().min(0).optional().allow(null),
    trainingEndDate: Joi.date().optional().allow(null),
    joiningDate: Joi.date(),
    isBond: Joi.boolean(),
    bondDurationInMonths: Joi.number().min(0).optional().allow(null),
    bondCompletedDate: Joi.date().optional().allow(null),
    nda: Joi.boolean(),
    ctcTemplate: Joi.string().hex().length(24).optional().allow(null, ""),
    remark: Joi.string().optional().allow("", null),
  }),
};

exports.getPayrollValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
  }),
};
exports.getPayrollByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deletePayrollValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

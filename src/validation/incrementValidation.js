const { Joi } = require("express-validation");

exports.addIncrementValidation = {
  body: Joi.object({
    userId: Joi.string().hex().length(24).required(),

    previousSalary: Joi.number().min(0).required(),
    incrementPercentage: Joi.number().min(0).optional(),
    incrementAmount: Joi.number().min(0).optional(),

    incrementMethod: Joi.string().valid("monthly", "yearly").required(),
    totalSalary: Joi.number().min(0).required(),
    effectiveFrom: Joi.date().required(),
  }),
};

exports.getIncrementValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
  }),
};

exports.getIncrementByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteIncrementValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const { Joi } = require("express-validation");

exports.addCriteriaValidation = {
  body: Joi.object({
    criteria: Joi.string().required().trim(),
    isRequired: Joi.boolean().required(),
  }),
};

exports.getCriteriaValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    criteria: Joi.string().trim(),
  }),
};

exports.updateCriteriaValidation = {
  body: Joi.object({
    isRequired: Joi.boolean(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteCriteriaValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getCriteriaByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

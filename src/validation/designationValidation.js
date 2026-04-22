const { Joi } = require("express-validation");

exports.addDesignationValidation = {
  body: Joi.object({
    departmentId: Joi.string().length(24).hex().required(),
    designationName: Joi.string().required(),
  }),
};

exports.getDesignationValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    departmentId: Joi.string().hex().length(24),
    designationName: Joi.string(),
  }),
};

exports.updateDesignationValidation = {
  body: Joi.object({
    departmentId: Joi.string().hex().length(24),
    designationName: Joi.string(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteDesignationValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getDesignationByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const { Joi } = require("express-validation");

exports.addDepartmentValidation = {
  body: Joi.object({
    departmentName: Joi.string().required(),
  }),
};

exports.getDepartmentValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    departmentName: Joi.string(),
  }),
};

exports.updateDepartmentValidation = {
  body: Joi.object({
    departmentName: Joi.string(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteDepartmentValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getDepartmentByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

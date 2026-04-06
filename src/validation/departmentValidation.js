const { Joi } = require('express-validation');

exports.adddepartmentValidation = {
    body: Joi.object({
        departmentName:Joi.string().required()
    })
}

exports.getdepartmentValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    departmentName:Joi.string()
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
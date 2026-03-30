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
    id:Joi.string().hex()
  }),
};
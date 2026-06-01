const { Joi } = require("express-validation");

exports.addTechStackValidation = {
  body: Joi.object({
    techName: Joi.string().required(),
  }),
};

exports.getTechStackValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    techName: Joi.string(),
  }),
};

exports.updateTechStackValidation = {
  body: Joi.object({
    techName: Joi.string(),
  }),

  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteTechStackValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getTechStackByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

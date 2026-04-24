const { Joi } = require("express-validation");

exports.addOrganizationValidation = {
  body: Joi.object({
    organizationName: Joi.string().required(),
    headHR: Joi.string().hex().length(24).allow(null, ""),
    organizationAddress: Joi.string().required(),
    logo: Joi.string().allow(null, ""),
    organizationAccountNumber: Joi.string().allow("", null),
    irregularEmployeeCriteria: Joi.object({
      days: Joi.number().integer().min(0),
      beforePercentage: Joi.number().min(0),
      afterPercentage: Joi.number().min(0),
    }).optional(),
  }),
};

exports.getOrganizationValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    organizationName: Joi.string(),
  }),
};

exports.getOrganizationByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.updateOrganizationValidation = {
  body: Joi.object({
    organizationName: Joi.string(),
    headHR: Joi.string().hex().length(24).allow(null, ""),
    organizationAddress: Joi.string(),
    logo: Joi.string().allow(null, ""),
    organizationAccountNumber: Joi.string().allow("", null),
    irregularEmployeeCriteria: Joi.object({
      days: Joi.number().integer().min(0),
      beforePercentage: Joi.number().min(0),
      afterPercentage: Joi.number().min(0),
    }).optional(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteOrganizationValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

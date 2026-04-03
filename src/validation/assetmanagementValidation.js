const { Joi } = require("express-validation");

exports.addAssetManagementValidation = {
  body: Joi.object({
    assetcategoryId: Joi.string().hex().length(24).required(),
    assetId: Joi.string().hex().length(24).required(),
    relatedTo: Joi.string().hex().length(24).required(),
    issueDate: Joi.date().optional(),
    remark: Joi.string().allow("", null),
  }),
};

exports.getAssetManagementValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    relatedTo: Joi.string().hex().length(24),
  }),
};

exports.updateAssetManagementValidation = {
  body: Joi.object({
    assetcategoryId: Joi.string().hex().length(24),
    assetId: Joi.string().hex().length(24),
    relatedTo: Joi.string().hex().length(24),
    issueDate: Joi.date(),
    remark: Joi.string().allow("", null),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteAssetManagementValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};
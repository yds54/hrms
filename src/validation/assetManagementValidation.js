const { Joi } = require("express-validation");

exports.addAssetManagementValidation = {
  body: Joi.object({
    assetCategoryId: Joi.string().hex().length(24).required(),
    assetId: Joi.string().hex().length(24).required(),
    relatedTo: Joi.string().hex().length(24).required(),
    issueDate: Joi.date().optional(),
    remark: Joi.string().allow("", null),
  }),
};

exports.getAssetManagementValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    relatedTo: Joi.string().hex().length(24),
    search: Joi.string().optional(),
    assetId: Joi.string().hex().length(24),
    assetCategoryId: Joi.string().hex().length(24),
  }),
};

exports.updateAssetManagementValidation = {
  body: Joi.object({
    assetCategoryId: Joi.string().hex().length(24),
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

exports.getAssetManagementByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

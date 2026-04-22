const { Joi } = require("express-validation");

exports.addAssetsValidation = {
  body: Joi.object({
    assetName: Joi.string().required(),
    assetCategoryId: Joi.string().hex().length(24).required(),
  }),
};

exports.getAssetsValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    assetName: Joi.string(),
    assetCategoryId: Joi.string().hex().length(24),
  }),
};

exports.updateAssetsValidation = {
  body: Joi.object({
    assetName: Joi.string(),
    assetCategoryId: Joi.string().hex().length(24),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteAssetsValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};
exports.getAssetByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const { Joi } = require("express-validation");

exports.addAssetCategoryValidation = {
  body: Joi.object({
    assetCategoryName: Joi.string().required(),
  }),
};

exports.getAssetCategoriesValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    assetCategoryName: Joi.string(),
  }),
};

exports.updateAssetCategoryValidation = {
  body: Joi.object({
    assetCategoryName: Joi.string(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteAssetCategoryValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getAssetCategoryByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

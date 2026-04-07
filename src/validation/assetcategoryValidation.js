const { Joi } = require("express-validation");

exports.addAssetCategoryValidation = {
  body: Joi.object({
    assetcategoryName: Joi.string().required(),
  }),
};

exports.getAssetCategoriesValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    assetcategoryName: Joi.string(),
  }),
};

exports.updateAssetCategoryValidation = {
  body: Joi.object({
    assetcategoryName: Joi.string(),
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

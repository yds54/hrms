const { Joi } = require('express-validation');

exports.addAssetsValidation = {
    body: Joi.object({
        assetName:Joi.string().required(),
        assetcategoryId:Joi.string().hex().length(24).required(),
    })
}

exports.getAssetsValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    assetName:Joi.string(),
    assetcategoryId:Joi.string().hex().length(24),
  }),
};

exports.updateAssetsValidation = {
  body: Joi.object({
    assetName: Joi.string(),
    assetcategoryId: Joi.string().hex().length(24),
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
const { Joi } = require("express-validation");

exports.addBankValidation = {
  body: Joi.object({
    bankName: Joi.string().required(),
  }),
};

exports.getBankValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    bankName: Joi.string(),
  }),
};

exports.updateBankValidation = {
  body: Joi.object({
    bankName: Joi.string(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteBankValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getBankByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

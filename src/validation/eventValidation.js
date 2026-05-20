const { Joi } = require("express-validation");

exports.getCelebrationAndIncrementDataValidation = {
  query: Joi.object({
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(1900).max(9999).optional(),
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    search: Joi.string().trim().allow("").optional(),
  }),
};

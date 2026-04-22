const { Joi } = require("express-validation");

exports.holidaydeleteValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
};

exports.getholidayValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    search: Joi.string()
      .pattern(/^\d{4}-(0[1-9]|1[0-2])$/) // YYYY-MM fomat
      .messages({
        "string.pattern.base": "Search must be in YYYY-MM format",
      })
      .optional(),
    id: Joi.string().hex(),
  }),
};

exports.addholidayValidation = {
  body: Joi.object({
    holidayDate: Joi.date().required(),
    holidayReason: Joi.string().required(),
  }),
};

exports.updateholidayValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),

  body: Joi.object({
    holidayDate: Joi.date().required(),
    holidayReason: Joi.string().required(),
  }),
};
//holidayDate
//holidayReason

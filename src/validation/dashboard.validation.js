const { Joi } = require("express-validation");


//=============== DISPLAY HOLIDAY DETAILS VALIDATION =======================
exports.getHolidayValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),

    search: Joi.string()
      .pattern(/^\d{4}-(0[1-9]|1[0-2])$/) // YYYY-MM fomat
      .messages({
        "string.pattern.base": "Search must be in YYYY-MM format",
      })
      .optional(),
  }),
};
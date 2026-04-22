const { Joi } = require("express-validation");

//================== ADD HOLIDAY VALIDATION ===============================
exports.addholidayValidation = {
  body: Joi.object({
    holidayDate: Joi.date().required(),
    holidayReason: Joi.string().required(),
  }),
};

//================== DISPLAY HOLIDAY VALIDATION ===============================
exports.getholidayValidation = {
  query: Joi.object({
    page: Joi.number().integer().required(),
    limit: Joi.number().integer().required(),
    filter: Joi.string()
      .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
      .messages({
        "string.pattern.base": "Search must be in YYYY-MM format",
      })
      .optional(),
    search: Joi.string().optional(),
    id: Joi.string().hex(),
  }),
};

//================== UPDATE HOLIDAY VALIDATION ===============================
exports.updateholidayValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
  body: Joi.object({
    holidayDate: Joi.date(),
    holidayReason: Joi.string(),
  }),
};

//================== DELETE HOLIDAY VALIDATION ===============================
exports.holidaydeleteValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
};

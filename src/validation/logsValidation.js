const { Joi } = require("express-validation");

exports.getLogsValidation = {
  query: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    action: Joi.string().valid("CREATE", "UPDATE", "DELETE").optional(),
    user: Joi.string(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    search: Joi.string().allow("", null),
  }),
};

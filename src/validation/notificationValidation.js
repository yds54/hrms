const { Joi } = require("express-validation");
const { NOTIFICATION_TYPE } = require("../utils/enum");

exports.getNotificationValidation = {
  query: Joi.object({
    page: Joi.number().required(),
    limit: Joi.number().required(),
    filter: Joi.string()
      .valid("all", ...Object.values(NOTIFICATION_TYPE))
      .default("all"),
    isRead: Joi.boolean().optional(),
    type: Joi.string().optional(),
  }),
};

const { Joi } = require("express-validation");

//==================== DISPLAY QUOTES VALIDATION ====================
exports.getDailyQuoteValidation = {
  query: Joi.object({}),
};

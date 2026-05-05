const { Joi } = require("express-validation");

//==================== ADD CRITERIA VALIDATION ====================
exports.createCriteriaValidation = {
  body: Joi.object({
    criteria: Joi.string().trim().required(),
  }),
};

//==================== GET CRITERIA VALIDATION ====================
exports.getCriteriaValidation = {
  query: Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    search: Joi.string().optional(),
  }),
};

//==================== DELETE CRITERIA VALIDATION ====================
exports.deleteCriteriaValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

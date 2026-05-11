const { Joi } = require("express-validation");

//==================== CREATE DRS FACTOR CRIATERIA VALIDATION ====================
exports.createDrsFactorValidation = {
  body: Joi.object({
    criteria: Joi.string().trim().required(),
  }),
};

//==================== GET DRS FACTOR CRIATERIA VALIDATION ====================
exports.getDrsFactorValidation = {
  query: Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    search: Joi.string().optional(),
  }),
};

//==================== DELETE DRS FACTOR CRIATERIA VALIDATION ====================
exports.deleteDrsFactorValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const { Joi } = require("express-validation");

//================ CREATE LETTERHEAD TYPE VALIDATION =================
exports.createLetterheadTypeValidation = {
  body: Joi.object({
    type: Joi.string().trim().required(),
  }),
};

//================ DISPLAY LETTERHEAD TYPE VALIDATION =================
exports.displayLetterheadTypeValidation = {
  query: Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    search: Joi.string().optional(),
  }),
};

//================ UPDATE LETTERHEAD TYPE VALIDATION =================
exports.updateLetterheadTypeValidation = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    type: Joi.string().trim().required(),
  }),
};

//================ DELETE LETTERHEAD TYPE VALIDATION =================
exports.deleteLetterheadTypeValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

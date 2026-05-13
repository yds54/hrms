const { Joi } = require("express-validation");

//================ CREATE ASSIGN LETTERHEAD VALIDATION =================
exports.createAssignLetterheadValidation = {
  body: Joi.object({
    issueTo: Joi.string().hex().length(24).required(),
    issueDate: Joi.date().required(),
    letterheadType: Joi.string().hex().length(24).required(),
    reason: Joi.string().trim(),
    note: Joi.string().allow(null),
    uploadDocument: Joi.string().optional(),
  }),
};

//================ DISPLAY ASSIGN LETTERHEAD VALIDATION =================
exports.displayAssignLetterheadValidation = {
  query: Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    search: Joi.string().optional(),
  }),
};

//================ UPDATE ASSIGN LETTERHEAD VALIDATION =================
exports.updateAssignLetterheadValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    issueTo: Joi.string().hex().length(24).optional(),
    issueDate: Joi.date().optional(),
    letterheadType: Joi.string().hex().length(24).optional(),
    reason: Joi.string().trim().optional(),
    note: Joi.string().allow(null),
    uploadDocument: Joi.string().optional(),
  }).min(1),
};

//================ DELETE ASSIGN LETTERHEAD VALIDATION =================
exports.deleteAssignLetterheadValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

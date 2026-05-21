const { Joi } = require("express-validation");

// ================= CREATE APPRECIATED USER VALIDATION ====================
exports.createAppreciationValidation = {
  body: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    designationId: Joi.string().optional().allow(null),
    projectId: Joi.string().optional().allow(null),
    date: Joi.string().required(),
    title: Joi.string().trim().required(),
  }),
};

// ================= DISPLAY APPRECIATED USER VALIDATION ====================
exports.getAppreciationsValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    search: Joi.string().optional(),
  }),
};

// ================= UPDATE APPRECIATED USER VALIDATION ====================
exports.updateAppreciationValidation = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    userId: Joi.string().hex().length(24).optional(),
    designationId: Joi.string().optional().allow(null),
    projectId: Joi.string().optional().allow(null),
    date: Joi.string().optional(),
    title: Joi.string().trim().optional(),
  }),
};

// ================= DELETE APPRECIATED USER VALIDATION ====================
exports.deleteAppreciationValidation = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
};

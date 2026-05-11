const { Joi } = require("express-validation");

exports.addTeamValidation = {
  body: Joi.object({
    teamName: Joi.string().required(),
    project: Joi.string().hex().length(24),
    projectManagers: Joi.array()
      .items(Joi.string().hex().length(24))
      .required(),
    teamLeaders: Joi.array().items(Joi.string().hex().length(24)),
    members: Joi.array().items(Joi.string().hex().length(24)),
  }),
};

exports.getTeamValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    search: Joi.string().allow("", null),
  }),
};

exports.getTeamByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.updateTeamValidation = {
  body: Joi.object({
    teamName: Joi.string(),
    project: Joi.string().hex().length(24),
    projectManagers: Joi.array().items(Joi.string().hex().length(24)),
    teamLeaders: Joi.array().items(Joi.string().hex().length(24)),
    members: Joi.array().items(Joi.string().hex().length(24)),
  }),

  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteTeamValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getProjectTeamSummaryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    projectStatus: Joi.string()
      .valid("inProgress", "Completed", "OnHold", "Pending", "Terminated")
      .allow("", null),
    projectType: Joi.string().allow("", null),
    search: Joi.string().allow("", null),
  }),
};

exports.removeTeamMemberValidation = {
  params: Joi.object({
    teamId: Joi.string().hex().length(24).required(),
    userId: Joi.string().hex().length(24).required(),
  }),
};

exports.getUnassignedUsersValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    search: Joi.string().allow("", null),
  }),
};

const { Joi } = require("express-validation");
const { PROJECT_STATUS } = require("../utils/enum");

exports.addProjectValidation = {
  body: Joi.object({
    projectName: Joi.string().required(),
    status: Joi.string()
      .valid("inProgress", "Completed", "OnHold", "Pending", "Terminated")
      .required(),
    type: Joi.string().required(),
    clientName: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null, ""),
    techStack: Joi.array().items(Joi.string()).allow(null),
    description: Joi.string().allow("", null),
  }),
};

exports.getProjectValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    projectStatus: Joi.string()
      .valid(...Object.values(PROJECT_STATUS))
      .allow("", null),
    projectType: Joi.string().allow("", null),
  }),
};

exports.getProjectByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.updateProjectValidation = {
  body: Joi.object({
    projectName: Joi.string(),

    status: Joi.string().valid(...Object.values(PROJECT_STATUS)),
    type: Joi.string(),
    clientName: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date().allow(null, ""),
    techStack: Joi.array().items(Joi.string()).allow(null),
    description: Joi.string().allow("", null),
  }),

  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteProjectValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

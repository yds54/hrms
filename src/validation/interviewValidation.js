const { Joi } = require("express-validation");

exports.addInterviewValidation = {
  body: Joi.object({
    name: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    previousCompanyName: Joi.string().trim().allow("", null),
    qualification: Joi.string().trim().required(),
    technology: Joi.string().trim().allow("", null),
    contactNumber: Joi.string().trim().required(),
    dateOfBirth: Joi.date().allow(null),
    email: Joi.string().email().trim().allow("", null),
    interviewMode: Joi.string().valid("Online", "Offline").optional(),
    yearOfExperience: Joi.number().min(0).optional(),
    currentSalary: Joi.number().min(0).optional(),
    expectedSalary: Joi.number().min(0).optional(),
    interviewTime: Joi.date().required(),
    callDate: Joi.date().optional(),
    technicalRoundUser: Joi.string().hex().length(24).required(),
    hrRoundUser: Joi.string().hex().length(24).required(),
    referenceUser: Joi.string().hex().length(24).allow(null, ""),
    interviewStatus: Joi.boolean().optional(),
    practicalTestStatus: Joi.boolean().optional(),
    communicationSkill: Joi.number().min(0).max(10).allow(null),
    confidenceOrBodyLang: Joi.number().min(0).max(10).allow(null),
    logicalSkills: Joi.number().min(0).max(10).allow(null),
    dataStructure: Joi.number().min(0).max(10).allow(null),
    objectOriented: Joi.number().min(0).max(10).allow(null),
    sql: Joi.number().min(0).max(10).allow(null),
    adaptionPower: Joi.number().min(0).max(10).allow(null),
    remark: Joi.string().trim().allow("", null),
    resume: Joi.string().trim(),
  }),
};

exports.getInterviewValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    search: Joi.string().allow("", null),
    interviewStatus: Joi.boolean().optional(),
  }),
};

exports.getInterviewByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.deleteInterviewValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.updateInterviewValidation = {
  body: Joi.object({
    name: Joi.string().trim(),
    address: Joi.string().trim(),
    previousCompanyName: Joi.string().trim().allow("", null),
    qualification: Joi.string().trim(),
    technology: Joi.string().trim().allow("", null),
    contactNumber: Joi.string().trim(),
    dateOfBirth: Joi.date().allow(null),
    email: Joi.string().email().trim().allow("", null),
    interviewMode: Joi.string().valid("Online", "Offline").optional(),
    yearOfExperience: Joi.number().min(0).optional(),
    currentSalary: Joi.number().min(0).optional(),
    expectedSalary: Joi.number().min(0).optional(),
    interviewTime: Joi.date(),
    callDate: Joi.date().optional(),
    technicalRoundUser: Joi.string().hex().length(24),
    hrRoundUser: Joi.string().hex().length(24),
    referenceUser: Joi.string().hex().length(24).allow(null, ""),
    interviewStatus: Joi.boolean(),
    practicalTestStatus: Joi.boolean(),
    communicationSkill: Joi.number().min(0).max(10).allow(null),
    confidenceOrBodyLang: Joi.number().min(0).max(10).allow(null),
    logicalSkills: Joi.number().min(0).max(10).allow(null),
    dataStructure: Joi.number().min(0).max(10).allow(null),
    objectOriented: Joi.number().min(0).max(10).allow(null),
    sql: Joi.number().min(0).max(10).allow(null),
    adaptionPower: Joi.number().min(0).max(10).allow(null),
    remark: Joi.string().trim().allow("", null),
    resume: Joi.string().trim(),
  }),

  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const { Joi } = require("express-validation");
const timeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)\s(AM|PM)$/;

//----------------- CREATE ATTENDANCE VALIDATION -------------------
exports.createAttendanceValidation = {
  body: Joi.object({
    fromDate: Joi.date().max("now").required(),
    toDate: Joi.date().min(Joi.ref("fromDate")).max("now").required(),
    userId: Joi.string().optional(),
    inTime: Joi.string().pattern(timeRegex).required(),
    outTime: Joi.string().pattern(timeRegex).optional(),
    lateReason: Joi.string().allow(null).optional(),
    leaveReason: Joi.string().allow(null).optional(),
    overTimeReason: Joi.string().allow(null).optional(),
  }),
};
//--------------- DISPLAY ATTENDANCE VALIDATION -------------------
exports.getAttendanceValidation = {
  query: Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    month: Joi.number().min(1).max(12).optional(),
    year: Joi.number().min(2000).max(2100).optional(),
    date: Joi.date().optional(),
    search: Joi.string().trim().optional(),
    userId: Joi.string().hex().length(24).optional(),
    gender: Joi.string().valid("male", "female", "other").optional(),
    attendanceType: Joi.string().optional(),
    organizationId: Joi.string().hex().length(24).optional(),
    overtime: Joi.boolean().optional(),
  }),
};

//--------------- DISPLAY ATTENDANCE LEAVE HISTORY -------------------
exports.getAttendanceHistoryValidation = {
  query: Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
    month: Joi.number().min(1).max(12).optional(),
    year: Joi.number().min(2000).max(2100).optional(),
    search: Joi.string().optional(),
  }),
};

exports.updateAttendanceValidation = {
  body: Joi.object({
    inTime: Joi.string().pattern(timeRegex).required(),
    outTime: Joi.string().pattern(timeRegex).required(),
    updateReason: Joi.string().trim().required(),
    extraMinutes: Joi.number().min(1),
  }),
};

exports.deleteAttendanceValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.getAttendanceReportValidation = {
  query: Joi.object({
    selectedDate: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(1).required(),
  }),
};

exports.getSandwichLeaveReportValidation = {
  query: Joi.object({
    selectedDate: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
    userId: Joi.string().allow("", null).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().allow("", null).optional(),
  }),
};

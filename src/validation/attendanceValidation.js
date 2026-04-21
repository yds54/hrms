const { Joi } = require("express-validation");
const timeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)\s(AM|PM)$/;

//----------------- CREATE ATTENDANCE VALIDATION -------------------
exports.createAttendanceValidation = {
  body: Joi.object({
    date: Joi.date().required(),
    inTime: Joi.string().pattern(timeRegex).required(),
    outTime: Joi.string().pattern(timeRegex).optional(),
    lateReason: Joi.string().allow("").optional(),
    leaveReason: Joi.string().allow("").optional(),
    overTimeReason: Joi.string().allow("").optional(),
  }),
};

//--------------- DISPLAY ATTENDANCE VALIDATION -------------------
exports.getAttendanceValidation = {
  query: Joi.object({
    page: Joi.number().min(1).optional().required(),
    limit: Joi.number().min(1).optional().required(),
    month: Joi.number().min(1).max(12).optional(),
    year: Joi.number().min(2000).max(2100).optional(),
  }),
};

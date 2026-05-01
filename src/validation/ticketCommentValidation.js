const { Joi } = require("express-validation");

//================ CREATE COMMENT =================
exports.createCommentValidation = {
  params: Joi.object({
    ticketId: Joi.string().hex().length(24).required(),
  }),

  body: Joi.object({
    comment: Joi.string().trim().optional(),
    attachFile: Joi.array().items(Joi.string()).optional(),
  }),
};

//================ GET COMMENTS =================
exports.getCommentValidation = {
  params: Joi.object({
    ticketId: Joi.string().hex().length(24).required(),
  }),
};

//================ DELETE COMMENT =================
exports.deleteCommentValidation = {
  params: Joi.object({
    commentId: Joi.string().hex().length(24).required(),
  }),
};

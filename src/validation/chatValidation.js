const { Joi } = require("express-validation");

exports.getOrCreateChatValidation = {
  params: Joi.object({
    userId: Joi.string().length(24).hex().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
  }),
};

exports.sendMessageValidation = {
  params: Joi.object({
    chatId: Joi.string().length(24).hex().required(),
  }),
  body: Joi.object({
    message: Joi.string().trim().min(1).max(5000).required(),
    messageType: Joi.string().valid("text", "image", "file").default("text"),
    fileData: Joi.object({
      fileName: Joi.string().optional(),
      fileUrl: Joi.string().uri().optional(),
      fileType: Joi.string().optional(),
      fileSize: Joi.number().optional(),
    }).optional(),
  }),
};

exports.getChatMessagesValidation = {
  params: Joi.object({
    chatId: Joi.string().length(24).hex().required(),
  }),
};

exports.getConversationsValidation = {
  query: Joi.object({
    search: Joi.string().optional(),
  }),
};

exports.getUserStatusValidation = {
  params: Joi.object({
    userId: Joi.string().length(24).hex().required(),
  }),
};

exports.markAsReadValidation = {
  params: Joi.object({
    chatId: Joi.string().length(24).hex().required(),
  }),
  body: Joi.object({
    messageIds: Joi.array().items(Joi.string().length(24).hex()).optional(),
  }),
};

exports.deleteChatValidation = {
  params: Joi.object({
    chatId: Joi.string().length(24).hex().required(),
  }),
};

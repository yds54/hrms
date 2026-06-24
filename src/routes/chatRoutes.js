const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  getOrCreateChat,
  getChatMessages,
  getConversations,
  deleteChat,
  getUnreadCount,
  getUserStatus,
  sendMessage,
  markMessagesAsRead,
} = require("../controller/chatController");

const {
  getOrCreateChatValidation,
  getChatMessagesValidation,
  getConversationsValidation,
  deleteChatValidation,
  getUserStatusValidation,
  sendMessageValidation,
  markAsReadValidation,
} = require("../validation/chatValidation");

router.get(
  "/conversations",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getConversationsValidation),
  getConversations,
);

router.get(
  "/user-status/:userId",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getUserStatusValidation),
  getUserStatus,
);

router.get(
  "/unread/count",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  getUnreadCount,
);

router.get(
  "/:chatId/messages",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getChatMessagesValidation),
  getChatMessages,
);

router.get(
  "/:userId",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getOrCreateChatValidation),
  getOrCreateChat,
);

router.delete(
  "/:chatId",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(deleteChatValidation),
  deleteChat,
);

module.exports = router;

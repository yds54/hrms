const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  getNotifications,
  markAllAsRead,
} = require("../controller/notificationController");

const {
  getNotificationValidation,
} = require("../validation/notificationValidation");

//===================== GET NOTIFICATIONS =====================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getNotificationValidation),
  getNotifications,
);

//===================== MARK ALL AS READ =====================
router.put(
  "/read-all",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  markAllAsRead,
);

module.exports = router;

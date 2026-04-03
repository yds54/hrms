const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createLeaveRequest,
  getLeaveHistory,
} = require("../controller/leaveController");

const {
  createLeaveValidation,
  getLeaveHistoryValidation,
} = require("../validation/leaveValidation");

//======================= SEND LEAVE REQUEST =================================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  validate(createLeaveValidation),
  createLeaveRequest,
);

//===================== LEAVE REQUEST HISTORY ============================
router.get(
  "/history",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  validate(getLeaveHistoryValidation),
  getLeaveHistory,
);

module.exports = router;

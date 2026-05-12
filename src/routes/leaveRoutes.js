const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createLeaveRequest,
  getLeaveHistory,
  updateLeaveRequest,
  deleteLeaveRequest,
  getTeamLeaveRequests,
} = require("../controller/leaveController");

const {
  createLeaveValidation,
  getLeaveHistoryValidation,
  updateLeaveValidation,
  deleteLeaveValidation,
  teamLeaveRequestValidation,
} = require("../validation/leaveValidation");

//======================= SEND LEAVE REQUEST =================================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(createLeaveValidation),
  createLeaveRequest,
);

//===================== LEAVE REQUEST HISTORY ============================
router.get(
  "/history",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getLeaveHistoryValidation),
  getLeaveHistory,
);

//===================== DISPLAY TEAM LEAVE REQUEST HISTORY ============================
router.get(
  "/team-leave-request",
  authenticateJWT,
  authorizeRoles(ROLES.PROJECT_MANAGER),
  validate(teamLeaveRequestValidation),
  getTeamLeaveRequests,
);

//==================== UPDATE LEAVE REQUEST ==========================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER),
  validate(updateLeaveValidation),
  updateLeaveRequest,
);

//==================== DELETE LEAVE REQUEST =====================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteLeaveValidation),
  deleteLeaveRequest,
);

module.exports = router;

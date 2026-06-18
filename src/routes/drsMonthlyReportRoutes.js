const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  upsertMonthlyReport,
  getMonthlyReport,
  getOrganizationDRSReport,
} = require("../controller/drsMonthlyReportController");

const {
  createMonthlyReportValidation,
  getMonthlyReportValidation,
  getOrganizationDRSReportValidation,
} = require("../validation/drsMonthlyReportValidation");

//============== CERATE AND UPDATE DRS MONTHLY REPORT TARGET VALIDATION ==========================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD),
  validate(createMonthlyReportValidation),
  upsertMonthlyReport,
);

// ================= DISPLAY ORGANIZATION DRS REPORT =================
router.get(
  "/organization",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getOrganizationDRSReportValidation),
  getOrganizationDRSReport,
);

//============== DISPLAY DRS MONTHLY REPORT ==========================
router.get(
  "/:userId",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getMonthlyReportValidation),
  getMonthlyReport,
);

module.exports = router;

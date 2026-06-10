const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addDrs,
  getDrs,
  updateDrs,
  getNotFilledDrs,
  getTeamNotFilledDrs,
  getDrsByUserId,
} = require("../controller/drsController");

const {
  drsValidation,
  getDrsValidation,
  updateDrsValidation,
  notFilledDrsValidation,
  teamNotFilledDrsValidation,
  getDrsByUserIdValidation,
} = require("../validation/drsValidation");

//==================== ADD DRS ===============================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(drsValidation),
  addDrs,
);

//==================== SHOW DRS ===============================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getDrsValidation),
  getDrs,
);

//============== NOT FILLED DRS ROUTES ====================
router.get(
  "/not-filled",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(notFilledDrsValidation),
  getNotFilledDrs,
);

//============== TEAM NOT FILLED DRS ROUTES ====================
router.get(
  "/team-not-filled",
  authenticateJWT,
  authorizeRoles(
    ROLES.ADMIN,
    ROLES.PROJECT_MANAGER,
    ROLES.HR_RECRUITER,
    ROLES.TEAM_LEAD,
  ),
  validate(teamNotFilledDrsValidation),
  getTeamNotFilledDrs,
);

//=================== DISPLAY DRS BY USER ID (ADMIN,PM, TL) =========================
router.get(
  "/:userId",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD),
  validate(getDrsByUserIdValidation),
  getDrsByUserId,
);

//======================== EDIT DRS =============================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(updateDrsValidation),
  updateDrs,
);

module.exports = router;

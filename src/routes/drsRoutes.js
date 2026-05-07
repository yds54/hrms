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
} = require("../controller/drsController");

const {
  drsValidation,
  getDrsValidation,
  updateDrsValidation,
  notFilledDrsValidation,
  teamNotFilledDrsValidation,
} = require("../validation/drsValidation");

//==================== ADD DRS ===============================

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  validate(drsValidation),
  addDrs,
);

//==================== SHOW DRS ===============================

router.get(
  "/show",
  authenticateJWT,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  validate(getDrsValidation),
  getDrs,
);

//======================== EDIT DRS =============================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  validate(updateDrsValidation),
  updateDrs,
);

//============== NOT FILLED DRS ROUTES ====================
router.get(
  "/not-filled",
  authenticateJWT,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  validate(notFilledDrsValidation),
  getNotFilledDrs,
);

//============== TEAM NOT FILLED DRS ROUTES ====================
router.get(
  "/team-not-filled",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD),
  validate(teamNotFilledDrsValidation),
  getTeamNotFilledDrs,
);

module.exports = router;

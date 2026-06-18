const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createAppreciationValidation,
  getAppreciationsValidation,
  updateAppreciationValidation,
  deleteAppreciationValidation,
} = require("../validation/appreciatedUserValidation");

const {
  createAppreciation,
  getAppreciations,
  updateAppreciation,
  deleteAppreciation,
} = require("../controller/appreciatedUserController");

// ================= CREATE APPRECIATED USER ====================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(createAppreciationValidation),
  createAppreciation,
);

// ================= DISPLAY APPRECIATED USER ====================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getAppreciationsValidation),
  getAppreciations,
);

// ================= UPDATE APPRECIATED USER ====================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateAppreciationValidation),
  updateAppreciation,
);

// ================= DELETE APPRECIATED USER ====================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteAppreciationValidation),
  deleteAppreciation,
);

module.exports = router;

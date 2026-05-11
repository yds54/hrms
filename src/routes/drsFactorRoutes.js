const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createDrsFactor,
  getDrsFactor,
  deleteDrsFactor,
} = require("../controller/drsFactorController");

const {
  createDrsFactorValidation,
  getDrsFactorValidation,
  deleteDrsFactorValidation,
} = require("../validation/drsFactorValidation");

//==================== CREATE DRS FACTOR CRIATERIA ====================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(createDrsFactorValidation),
  createDrsFactor,
);

//==================== GET DRS FACTOR CRIATERIA ====================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getDrsFactorValidation),
  getDrsFactor,
);

//==================== DELETE DRS FACTOR CRIATERIA ====================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteDrsFactorValidation),
  deleteDrsFactor,
);

module.exports = router;

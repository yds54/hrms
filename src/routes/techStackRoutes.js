const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();
const {
  addTechStack,
  getAllTechStacks,
  updateTechStack,
  deleteTechStack,
  getTechStackById,
} = require("../controller/techStackController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addTechStackValidation,
  getTechStackValidation,
  updateTechStackValidation,
  deleteTechStackValidation,
  getTechStackByIdValidation,
} = require("../validation/techStackValidation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addTechStackValidation),
  addTechStack,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getTechStackValidation),
  getAllTechStacks,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getTechStackByIdValidation),
  getTechStackById,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateTechStackValidation),
  updateTechStack,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteTechStackValidation),
  deleteTechStack,
);

module.exports = router;

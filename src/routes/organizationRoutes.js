const express = require("express");
const router = express.Router();

const {
  addOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} = require("../controller/organizationController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const uploads = require("../middleware/uploads");

const { ROLES } = require("../utils/enum");

const {
  addOrganizationValidation,
  getOrganizationValidation,
  updateOrganizationValidation,
  deleteOrganizationValidation,
  getOrganizationByIdValidation,
} = require("../validation/organizationValidation");

const { validate } = require("express-validation");

router.post(
  "/",
  uploads("organizationLogo").single("logo"),
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addOrganizationValidation),
  addOrganization,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getOrganizationValidation),
  getAllOrganizations,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getOrganizationByIdValidation),
  getOrganizationById,
);

router.put(
  "/:id",
  uploads("organizationLogo").single("logo"),
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateOrganizationValidation),
  updateOrganization,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteOrganizationValidation),
  deleteOrganization,
);

module.exports = router;

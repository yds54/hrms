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
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");

const {
  addOrganizationValidation,
  getOrganizationValidation,
  updateOrganizationValidation,
  deleteOrganizationValidation,
  getOrganizationByIdValidation,
} = require("../validation/organization.validation");

const { validate } = require("express-validation");


router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addOrganizationValidation),
  addOrganization
);


router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getOrganizationValidation),
  getAllOrganizations
);


router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getOrganizationByIdValidation),
  getOrganizationById
);


router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateOrganizationValidation),
  updateOrganization
);


router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteOrganizationValidation),
  deleteOrganization
);

module.exports = router;
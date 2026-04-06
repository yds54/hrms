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
const {ROLES}= require("../utils/enum")


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
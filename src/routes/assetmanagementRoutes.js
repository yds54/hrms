const express = require("express");
const router = express.Router();

const {
  addAssetManagement,
  getAllAssetManagement,
  updateAssetManagement,
  deleteAssetManagement,
} = require("../controller/assetmanagementController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addAssetManagementValidation,
  getAssetManagementValidation,
  updateAssetManagementValidation,
  deleteAssetManagementValidation,
} = require("../validation/assetmanagementValidation");
const { validate } = require("express-validation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addAssetManagementValidation),
  addAssetManagement,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  validate(getAssetManagementValidation),
  getAllAssetManagement,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateAssetManagementValidation),
  updateAssetManagement,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteAssetManagementValidation),
  deleteAssetManagement,
);

module.exports = router;

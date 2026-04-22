const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();

const {
  addAssetManagement,
  getAllAssetManagement,
  updateAssetManagement,
  deleteAssetManagement,
  getAssetManagementById,
} = require("../controller/assetManagementController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addAssetManagementValidation,
  getAssetManagementValidation,
  updateAssetManagementValidation,
  deleteAssetManagementValidation,
  getAssetManagementByIdValidation,
} = require("../validation/assetManagementValidation");

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
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  validate(getAssetManagementByIdValidation),
  getAssetManagementById,
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

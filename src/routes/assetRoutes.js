const express = require("express");
const { validate } = require("express-validation");

const router = express.Router();

const {
  addAsset,
  getAllAssets,
  updateAsset,
  deleteAsset,
  getAssetById,
} = require("../controller/assetController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");
const {
  addAssetsValidation,
  getAssetsValidation,
  updateAssetsValidation,
  deleteAssetsValidation,
  getAssetByIdValidation,
} = require("../validation/assetValidation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(addAssetsValidation),
  addAsset,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getAssetsValidation),
  getAllAssets,
);
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getAssetByIdValidation),
  getAssetById,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(updateAssetsValidation),
  updateAsset,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(deleteAssetsValidation),
  deleteAsset,
);

module.exports = router;

const express = require("express");
const { validate } = require("express-validation");

const router = express.Router();

const {
  addAsset,
  getAllAssets,
  updateAsset,
  deleteAsset,
  getassetbyId,
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
  authorizeRoles(ROLES.ADMIN),
  validate(addAssetsValidation),
  addAsset,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  validate(getAssetsValidation),
  getAllAssets,
);
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getAssetByIdValidation),
  getassetbyId,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateAssetsValidation),
  updateAsset,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteAssetsValidation),
  deleteAsset,
);

module.exports = router;

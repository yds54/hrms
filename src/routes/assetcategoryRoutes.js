const express = require("express");
const router = express.Router();

const {
  addAssetCategory,
  getAllAssetCategorie,
  updateAssetCategory,
  deleteAssetCategory,
} = require("../controller/assetcategoryController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");
const {
  addAssetCategoryValidation,
  getAssetCategoriesValidation,
  updateAssetCategoryValidation,
  deleteAssetCategoryValidation,
} = require("../validation/assetcategoryValidation");
const { validate } = require("express-validation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addAssetCategoryValidation),
  addAssetCategory,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getAssetCategoriesValidation),
  getAllAssetCategorie,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateAssetCategoryValidation),
  updateAssetCategory,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteAssetCategoryValidation),
  deleteAssetCategory,
);

module.exports = router;

const express = require("express");
const { validate } = require("express-validation");

const router = express.Router();

const {
  addAssetCategory,
  getAllAssetCategorie,
  updateAssetCategory,
  deleteAssetCategory,
  getassetcategorybyId,
} = require("../controller/assetcategoryController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");
const {
  addAssetCategoryValidation,
  getAssetCategoriesValidation,
  updateAssetCategoryValidation,
  deleteAssetCategoryValidation,
  getAssetCategoryByIdValidation,
} = require("../validation/assetcategoryValidation");

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
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getAssetCategoryByIdValidation),
  getassetcategorybyId,
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

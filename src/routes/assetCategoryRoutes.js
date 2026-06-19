const express = require("express");
const { validate } = require("express-validation");

const router = express.Router();

const {
  addAssetCategory,
  getAllAssetCategories,
  updateAssetCategory,
  deleteAssetCategory,
  getAssetCategoryById,
} = require("../controller/assetCategoryController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");
const {
  addAssetCategoryValidation,
  getAssetCategoriesValidation,
  updateAssetCategoryValidation,
  deleteAssetCategoryValidation,
  getAssetCategoryByIdValidation,
} = require("../validation/assetCategoryValidation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(addAssetCategoryValidation),
  addAssetCategory,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getAssetCategoriesValidation),
  getAllAssetCategories,
);
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getAssetCategoryByIdValidation),
  getAssetCategoryById,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(updateAssetCategoryValidation),
  updateAssetCategory,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(deleteAssetCategoryValidation),
  deleteAssetCategory,
);

module.exports = router;

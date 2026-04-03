const express = require("express");
const router = express.Router();

const {
  addAsset,
  getAllAssets,
  updateAsset,
  deleteAsset,
} = require("../controller/assetController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");
const {} = require("../validation/assetcategoryValidation");
const { validate } = require("express-validation");

router.post("/", authenticateJWT, authorizeRoles(ROLES.ADMIN), addAsset);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  getAllAssets,
);
router.put("/:id", authenticateJWT, authorizeRoles(ROLES.ADMIN), updateAsset);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  deleteAsset,
);

module.exports = router;

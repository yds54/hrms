const express = require("express");
const router = express.Router();

const {
  addDesignation,
  getAllDesignation,
  updateDesignation,
  deleteDesignation,
} = require("../controller/designationController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const {
  addDesignationValidation,
  getDesignationValidation,
  updateDesignationValidation,
  deleteDesignationValidation,
} = require("../validation/designationValidation");
const { validate } = require("express-validation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addDesignationValidation),
  addDesignation,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getDesignationValidation),
  getAllDesignation,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateDesignationValidation),
  updateDesignation,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteDesignationValidation),
  deleteDesignation,
);

module.exports = router;

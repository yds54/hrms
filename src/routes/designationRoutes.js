const express = require("express");
const router = express.Router();

const {
  addDesignation,
  getAllDesignation,
  updateDesignation,
  deleteDesignation,
  getDesignationById,
} = require("../controller/designationController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addDesignationValidation,
  getDesignationValidation,
  updateDesignationValidation,
  deleteDesignationValidation,
  getDesignationByIdValidation,
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
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getDesignationByIdValidation),
  getDesignationById,
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

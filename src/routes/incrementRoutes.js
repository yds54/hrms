const express = require("express");
const router = express.Router();

const {
  addIncrement,
  getIncrementById,
  getAllUsersIncrements,
  deleteIncrement,
} = require("../controller/incrementController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");

const {
  addIncrementValidation,
  getIncrementByIdValidation,
  getIncrementValidation,
  deleteIncrementValidation,
} = require("../validation/incrementValidation");

const { validate } = require("express-validation");
const { ROLES } = require("../utils/enum");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addIncrementValidation),
  addIncrement,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getIncrementByIdValidation),
  getIncrementById,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getIncrementValidation),
  getAllUsersIncrements,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteIncrementValidation),
  deleteIncrement,
);

module.exports = router;

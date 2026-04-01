const express = require("express");
const router = express.Router();

const { viewUser } = require("../controller/profileController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");

const { getuserValidation } = require("../validation/user.Validation");

const { validate } = require("express-validation");

//============== DISPLAY LOGIN USER INFO ===============

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  validate(getuserValidation),
  viewUser,
);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
  logoutUser,
} = require("../controller/authController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const uploads = require("../middleware/uploads");
const {
  userRegisterValidation,
  loginValidation,
} = require("../validation/authValidation");

const { validate } = require("express-validation");

router.post(
  "/register",
  uploads("profile").single("profilePicture"),
  validate(userRegisterValidation),
  registerUser,
);

//================ login user =====================

router.post("/login", validate(loginValidation), loginUser);

//============== LOGOUT =====================
router.post("/logout", authenticateJWT, logoutUser);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
  logoutUser,
  forgotPassword,
  changePassword,
} = require("../controller/authController");

const {
  authenticateJWT,
  optionalAuthResetPassword,
} = require("../middleware/authentication");
const uploads = require("../middleware/uploads");
const {
  userRegisterValidation,
  loginValidation,
  forgotPasswordValidation,
  changePasswordValidation,
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

//============== FORGOT PASSWORD ==========================
router.post(
  "/forgot-password",
  validate(forgotPasswordValidation),
  forgotPassword,
);

//============= CHANGE PASSWORD =================
router.post(
  "/change-password",
  optionalAuthResetPassword,
  validate(changePasswordValidation),
  changePassword,
);

module.exports = router;

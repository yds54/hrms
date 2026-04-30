const express = require("express");
const router = express.Router();

const { validate } = require("express-validation");
const cloudinaryUpload = require("../middleware/cloudinaryUpload");
const uploads = require("../middleware/uploads");
const {
  authenticateJWT,
  resetPasswordAuthenticate,
} = require("../middleware/authentication");

const {
  loginUser,
  registerUser,
  logoutUser,
  forgotPassword,
  changePassword,
} = require("../controller/authController");

const {
  userRegisterValidation,
  loginValidation,
  forgotPasswordValidation,
  changePasswordValidation,
} = require("../validation/authValidation");

//================ REGISTER USER ================
router.post(
  "/register",
  uploads("profile").single("profilePicture"),
  cloudinaryUpload({
    folder: "profile",
  }),
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
  resetPasswordAuthenticate,
  validate(changePasswordValidation),
  changePassword,
);

module.exports = router;

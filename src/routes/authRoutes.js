const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
} = require("../controller/authController");

const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const upload = require("../middleware/upload");
const {
  UserValidation,
  loginValidation,
} = require("../validation/user.Validation");

const { validate } = require("express-validation");

router.post(
  "/register",
  upload.single("profilePicture"),
  validate(UserValidation),
  registerUser,
);

router.post("/login", validate(loginValidation), loginUser);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
   logoutUser,
} = require("../controller/authController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const upload = require("../middleware/upload");
const {
  UserValidation,
  loginValidation,
  getuserValidation,
} = require("../validation/user.Validation");

const { validate } = require("express-validation");

router.post(
  "/register",
  upload.single("profilePicture"),
  validate(UserValidation),
  registerUser,
);



//================ login user =====================

router.post("/login", validate(loginValidation), loginUser);

//============== LOGOUT =====================
router.post("/logout", authenticateJWT, logoutUser);



module.exports = router;
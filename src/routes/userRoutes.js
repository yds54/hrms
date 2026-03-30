const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
  viewallUser,
  updateUser,
  deleteUser
} = require("../controller/userController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const upload = require("../middleware/upload");

const {
  UserValidation,
  loginValidation,
  getuserValidation,
  updateUserValidation,
  userdeleteValidation
} = require("../validation/userValidation");

const { validate } = require("express-validation");

router.post(
  "/register",
  upload.single("profilePicture"),
  validate(UserValidation),
  registerUser,
);

router.post("/login", validate(loginValidation), loginUser);

router.get("/", authenticateJWT, authorizeRoles(ROLES.ADMIN), validate(getuserValidation),viewallUser);

router.put("/:id", authenticateJWT,authorizeRoles(ROLES.ADMIN), validate(updateUserValidation),updateUser);

router.delete("/:id", authenticateJWT,authorizeRoles(ROLES.ADMIN), validate(userdeleteValidation),deleteUser);

module.exports = router;

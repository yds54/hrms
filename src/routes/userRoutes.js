const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
  viewUser,
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
} = require("../validation/user.Validation");

const { validate } = require("express-validation");



router.get("/", authenticateJWT, authorizeRoles(ROLES.ADMIN), validate(getuserValidation),viewallUser);

router.put("/:id", authenticateJWT,authorizeRoles(ROLES.ADMIN), validate(updateUserValidation),updateUser);

router.delete("/:id", authenticateJWT,authorizeRoles(ROLES.ADMIN), validate(userdeleteValidation),deleteUser);


// //============== DISPLAY LOGIN USER INFO ===============

// router.get(
//   "/profile",
//   authenticateJWT,
//   authorizeRoles(ROLES.USER),
//   validate(getuserValidation),
//   viewUser
// );


module.exports = router;

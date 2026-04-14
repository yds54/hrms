const express = require("express");
const router = express.Router();

const {
  viewallUser,
  updateUser,
  deleteUser,
  getUserById,
} = require("../controller/userController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const upload = require("../middleware/upload");

const {
  getuserValidation,
  updateUserValidation,
  userdeleteValidation,
  getUserByIdValidation,
} = require("../validation/userValidation");

const { validate } = require("express-validation");
const { ROLES } = require("../utils/enum");

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  validate(getuserValidation),
  viewallUser,
);
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getUserByIdValidation),
  getUserById,
);

router.put(
  "/:id",
  authenticateJWT,
  upload.single("profilePicture"),
  authorizeRoles(ROLES.ADMIN),
  validate(updateUserValidation),
  updateUser,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(userdeleteValidation),
  deleteUser,
);

module.exports = router;

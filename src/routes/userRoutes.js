const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const upload = require("../middleware/uploads");
const { ROLES } = require("../utils/enum");

const {
  getuserValidation,
  updateUserValidation,
  userdeleteValidation,
  getUserByIdValidation,
  gstAllUsersByOrganizationValidation,
  getRandomUsersValidation,
} = require("../validation/userValidation");

const {
  viewallUser,
  updateUser,
  deleteUser,
  getUserById,
  gstAllUsersByOrganization,
  getRandomUsers,
  userInfo,
} = require("../controller/userController");

//============ DISPLAY USERS =================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getuserValidation),
  viewallUser,
);

//==================== DISPLAY ORGANIZATION USERS ================
router.get(
  "/organization",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(gstAllUsersByOrganizationValidation),
  gstAllUsersByOrganization,
);

router.get(
  "/randomusers",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getRandomUsersValidation),
  getRandomUsers,
);

router.get(
  "/user-info",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  userInfo,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getUserByIdValidation),
  getUserById,
);

//==================== UPDATE PROFILE ================
router.put(
  "/:id",
  authenticateJWT,
  upload("profile", {
    useTimestamp: true,
  }).single("profilePicture"),
  authorizeRoles(...Object.values(ROLES)),
  validate(updateUserValidation),
  updateUser,
);

//==================== DELETE USER ================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(userdeleteValidation),
  deleteUser,
);

module.exports = router;

const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");
const createUploader = require("../middleware/uploads");
const upload = createUploader("letterHead", {
  useUserFolder: true,
  useTimestamp: true,
});

const {
  createAssignLetterhead,
  getAssignLetterhead,
  updateAssignLetterhead,
  deleteAssignLetterhead,
} = require("../controller/assignLetterheadController");

const {
  createAssignLetterheadValidation,
  displayAssignLetterheadValidation,
  updateAssignLetterheadValidation,
  deleteAssignLetterheadValidation,
} = require("../validation/assignLetterheadValidation");

//================ CREATE ASSIGN LETTERHEAD TYPE  =================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  upload.single("uploadDocument"),
  validate(createAssignLetterheadValidation),
  createAssignLetterhead,
);

//================ DISPLAY ASSIGN LETTERHEAD TYPE =================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(displayAssignLetterheadValidation),
  getAssignLetterhead,
);

//================ UPDATE ASSIGN LETTERHEAD TYPE =================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  upload.single("uploadDocument"),
  validate(updateAssignLetterheadValidation),
  updateAssignLetterhead,
);

//================ DELETE ASSIGN LETTERHEAD TYPE =================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(deleteAssignLetterheadValidation),
  deleteAssignLetterhead,
);

module.exports = router;

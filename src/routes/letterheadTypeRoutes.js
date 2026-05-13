const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createLetterheadType,
  getLetterheadType,
  updateLetterheadType,
  deleteLetterheadType,
} = require("../controller/letterheadTypeController");

const {
  createLetterheadTypeValidation,
  displayLetterheadTypeValidation,
  updateLetterheadTypeValidation,
  deleteLetterheadTypeValidation,
} = require("../validation/letterheadTypeValidation");

//================ CREATE LETTERHEAD TYPE  =================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(createLetterheadTypeValidation),
  createLetterheadType,
);

//================ DISPLAY LETTERHEAD TYPE =================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(displayLetterheadTypeValidation),
  getLetterheadType,
);

//================ UPDATE LETTERHEAD TYPE =================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(updateLetterheadTypeValidation),
  updateLetterheadType,
);

//================ DELETE LETTERHEAD TYPE =================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(deleteLetterheadTypeValidation),
  deleteLetterheadType,
);

module.exports = router;

const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  getCelebrationAndIncrementData,
} = require("../controller/eventController");

const {
  getCelebrationAndIncrementDataValidation,
} = require("../validation/eventValidation");

router.get(
  "/monthly-records",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR,ROLES.HR_RECRUITER),
  validate(getCelebrationAndIncrementDataValidation),
  getCelebrationAndIncrementData,
);

module.exports = router;

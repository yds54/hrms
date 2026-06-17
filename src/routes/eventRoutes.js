const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  getCelebrationAndIncrementData,
  getTodayCelebrations,
} = require("../controller/eventController");

const {
  getCelebrationAndIncrementDataValidation,
} = require("../validation/eventValidation");

router.get(
  "/todays-celebrations",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  getTodayCelebrations,
);

router.get(
  "/monthly-records",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getCelebrationAndIncrementDataValidation),
  getCelebrationAndIncrementData,
);

module.exports = router;

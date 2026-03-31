const express = require('express');
const router = express.Router();
const { validate } = require("express-validation");


const {authenticateJWT} = require('../middleware/authentication');
const {authorizeRoles} = require('../middleware/roleAuthorization');
const { ROLES } = require("../utils/enum");

const {getHolidays} = require('../controller/dashboardController');

const {getHolidayValidation} = require('../validation/dashboard.validation');


//================= DISPLAY HOLIDAY DETAILS ============================
router.get(
  "/holidays",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  validate(getHolidayValidation),
  getHolidays
);

module.exports = router;
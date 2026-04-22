const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  holidaydeleteValidation,
  getholidayValidation,
  addholidayValidation,
  updateholidayValidation,
} = require("../validation/holidayValidation");

const {
  addHoliday,
  viewAllHolidays,
  deleteHoliday,
  updateHoliday,
} = require("../controller/holiDaysController");

//================== INSERT HOLIDAY ==========================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addholidayValidation),
  addHoliday,
);

//================== DISPLAY HOLIDAY ==========================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  validate(getholidayValidation),
  viewAllHolidays,
);

//================== UPDATE HOLIDAY ==========================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateholidayValidation),
  updateHoliday,
);

//================== DELETE HOLIDAY ==========================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(holidaydeleteValidation),
  deleteHoliday,
);

module.exports = router;

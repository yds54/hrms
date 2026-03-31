const express = require("express");
const router = express.Router();

const{addHoliday,viewAllHolidays,deleteHoliday,updateHoliday} = require("../controller/holiDaysController")
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const {holidaydeleteValidation,getholidayValidation,addholidayValidation,updateholidayValidation} = require("../validation/holiday.Validation");
const {validate} = require('express-validation')

router.post("/", authenticateJWT, authorizeRoles(ROLES.ADMIN),validate(addholidayValidation),addHoliday);
router.get("/",authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(getholidayValidation),viewAllHolidays)
router.delete("/:id",authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(holidaydeleteValidation),deleteHoliday)
router.put("/:id",authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(updateholidayValidation),updateHoliday)
module.exports = router;

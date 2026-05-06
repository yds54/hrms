const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");
const upload = require("../middleware/uploads");

const {
  createAttendance,
  getAttendance,
  getAttendanceHistory,
} = require("../controller/attendanceController");

const {
  createAttendanceValidation,
  getAttendanceValidation,
  getAttendanceHistoryValidation,
} = require("../validation/attendanceValidation");

//------------------ CREATE ATTENDANCE ---------------------------
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.USER),
  upload("attendance", {
    useUserFolder: true,
    useTimestamp: true,
  }).fields([
    { name: "entry", maxCount: 1 },
    { name: "exit", maxCount: 1 },
  ]),
  validate(createAttendanceValidation),
  createAttendance,
);

//--------------- DISPLAY ATTENDANCE ------------------------
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  validate(getAttendanceValidation),
  getAttendance,
);

//-------------- DISPLAY ATTENDANCE LEAVE HISTORY -----------------
router.get(
  "/history",
  authenticateJWT,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  validate(getAttendanceHistoryValidation),
  getAttendanceHistory,
);

module.exports = router;

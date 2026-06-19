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
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  getSandwichLeaveReport,
} = require("../controller/attendanceController");

const {
  createAttendanceValidation,
  getAttendanceValidation,
  getAttendanceHistoryValidation,
  updateAttendanceValidation,
  deleteAttendanceValidation,
  getAttendanceReportValidation,
  getSandwichLeaveReportValidation,
} = require("../validation/attendanceValidation");

//------------------ CREATE ATTENDANCE ---------------------------
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  upload("attendance").fields([
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
  authorizeRoles(...Object.values(ROLES)),
  validate(getAttendanceValidation),
  getAttendance,
);

//-------------- DISPLAY ATTENDANCE LEAVE HISTORY -----------------
router.get(
  "/history",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getAttendanceHistoryValidation),
  getAttendanceHistory,
);

router.get(
  "/report",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getAttendanceReportValidation),
  getAttendanceReport,
);

router.get(
  "/sandwich-report",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(getSandwichLeaveReportValidation),
  getSandwichLeaveReport,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(updateAttendanceValidation),
  updateAttendance,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  deleteAttendance,
);

module.exports = router;

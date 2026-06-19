const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { validate } = require("express-validation");
const { ROLES } = require("../utils/enum");

const {
  addPayrollValidation,
  getPayrollByIdValidation,
  updatePayrollValidation,
  getPayrollValidation,
  deletePayrollValidation,
  BondCompletedEmployeesValidation,
} = require("../validation/userpayrollValidation");

const {
  addUserPayroll,
  getUserPayrollById,
  updateUserPayroll,
  getAllUsersPayrolls,
  deleteUserPayroll,
  getBondCompltedUsers,
} = require("../controller/userPayrollController");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(addPayrollValidation),
  addUserPayroll,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getPayrollValidation),
  getAllUsersPayrolls,
);

router.get(
  "/bond-completed",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(BondCompletedEmployeesValidation),
  getBondCompltedUsers,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getPayrollByIdValidation),
  getUserPayrollById,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(updatePayrollValidation),
  updateUserPayroll,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(deletePayrollValidation),
  deleteUserPayroll,
);

module.exports = router;

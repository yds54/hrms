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
} = require("../validation/userpayrollValidation");

const {
  addUserPayroll,
  getUserPayrollById,
  updateUserPayroll,
  getAllUsersPayrolls,
  deleteUserPayroll,
} = require("../controller/userPayrollController");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addPayrollValidation),
  addUserPayroll,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getPayrollValidation),
  getAllUsersPayrolls,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.USER),
  validate(getPayrollByIdValidation),
  getUserPayrollById,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updatePayrollValidation),
  updateUserPayroll,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deletePayrollValidation),
  deleteUserPayroll,
);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartments,
} = require("../controller/departmentController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const {ROLES}= require("../utils/enum")

const {
  adddepartmentValidation,
  getdepartmentValidation,
  updateDepartmentValidation,
  deleteDepartmentValidation,
} = require("../validation/departmentValidation");
const { validate } = require("express-validation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(adddepartmentValidation),
  addDepartment,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getdepartmentValidation),
  getAllDepartments,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateDepartmentValidation),
  updateDepartment,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteDepartmentValidation),
  deleteDepartment,
);

module.exports = router;

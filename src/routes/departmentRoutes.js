const express = require("express");
const router = express.Router();

const {
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
} = require("../controller/departmentController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addDepartmentValidation,
  getDepartmentValidation,
  updateDepartmentValidation,
  deleteDepartmentValidation,
  getDepartmentByIdValidation,
} = require("../validation/departmentValidation");

const { validate } = require("express-validation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(addDepartmentValidation),
  addDepartment,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(getDepartmentValidation),
  getAllDepartments,
);
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(getDepartmentByIdValidation),
  getDepartmentById,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(updateDepartmentValidation),
  updateDepartment,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(deleteDepartmentValidation),
  deleteDepartment,
);

module.exports = router;

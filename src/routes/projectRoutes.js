const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();

const {
  addProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  updateProject,
} = require("../controller/projectController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addProjectValidation,
  deleteProjectValidation,
  getProjectByIdValidation,
  getProjectValidation,
  updateProjectValidation,
} = require("../validation/projectValidation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addProjectValidation),
  addProject,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getProjectValidation),
  getAllProjects,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getProjectByIdValidation),
  getProjectById,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateProjectValidation),
  updateProject,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteProjectValidation),
  deleteProject,
);

module.exports = router;

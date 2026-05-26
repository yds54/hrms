const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();

const {
  addTeam,
  deleteTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  getProjectTeamSummary,
  removeTeamMember,
  getUnassignedUsers,
  getProjectByUserId,
  getTeamMembers,
} = require("../controller/teamController");

const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addTeamValidation,
  deleteTeamValidation,
  getTeamByIdValidation,
  getTeamValidation,
  updateTeamValidation,
  getProjectTeamSummaryValidation,
  removeTeamMemberValidation,
  getUnassignedUsersValidation,
  getProjectByUserIdValidation,
} = require("../validation/teamsValidation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(addTeamValidation),
  addTeam,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getTeamValidation),
  getAllTeams,
);

router.get(
  "/projectsummary",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getProjectTeamSummaryValidation),
  getProjectTeamSummary,
);

router.get(
  "/unassigned-users",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(getUnassignedUsersValidation),
  getUnassignedUsers,
);

router.get(
  "/user/:userId/projects",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(getProjectByUserIdValidation),
  getProjectByUserId,
);

router.get(
  "/members",
  authenticateJWT,
  authorizeRoles(ROLES.PROJECT_MANAGER),
  getTeamMembers,
);
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getTeamByIdValidation),
  getTeamById,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(updateTeamValidation),
  updateTeam,
);

router.delete(
  "/:teamId/member/:userId",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(removeTeamMemberValidation),
  removeTeamMember,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteTeamValidation),
  deleteTeam,
);

module.exports = router;

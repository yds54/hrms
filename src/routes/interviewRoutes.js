const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();
const {
  addInterview,
  getAllInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
} = require("../controller/interviewController");
const { authenticateJWT } = require("../middleware/authentication");
const uploads = require("../middleware/uploads");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addInterviewValidation,
  getInterviewValidation,
  getInterviewByIdValidation,
  updateInterviewValidation,
  deleteInterviewValidation,
} = require("../validation/interviewValidation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  uploads("interviewResume").single("resume"),
  validate(addInterviewValidation),
  addInterview,
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getInterviewValidation),
  getAllInterviews,
);

router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getInterviewByIdValidation),
  getInterviewById,
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  uploads("interviewResume").single("resume"),
  validate(updateInterviewValidation),
  updateInterview,
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(deleteInterviewValidation),
  deleteInterview,
);

module.exports = router;

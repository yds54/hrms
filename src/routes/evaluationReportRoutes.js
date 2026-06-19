const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  upsertEvaluationReport,
  getEvaluationReport,
  getRemainingEvaluation,
} = require("../controller/evaluationReportController");

const {
  createEvaluationReportValidation,
  getEvaluationReportValidation,
} = require("../validation/evaluationReportValidation");

//========================= UPSERT EVALUATION REPORT ==========================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD),
  validate(createEvaluationReportValidation),
  upsertEvaluationReport,
);

//========================= GET EVALUATION REPORT ==========================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getEvaluationReportValidation),
  getEvaluationReport,
);

//========================= GET REMAINING EVALUATION ==========================
router.get(
  "/remaining",
  authenticateJWT,
  authorizeRoles(ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD),
  getRemainingEvaluation,
);

module.exports = router;

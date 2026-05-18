const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createEvaluationReport,
  getEvaluationReport,
  updateEvaluationReport,
} = require("../controller/evaluationReportController");

const {
  createEvaluationReportValidation,
  getEvaluationReportValidation,
  updateEvaluationReportValidation,
} = require("../validation/evaluationReportValidation");

//========================= CREATE EVALIATION REPORT ==========================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER),
  validate(createEvaluationReportValidation),
  createEvaluationReport,
);

//========================= GET EVALUATION REPORT ==========================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getEvaluationReportValidation),
  getEvaluationReport,
);

//========================= UPDATE EVALUATION REPORT ==========================
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.PROJECT_MANAGER),
  validate(updateEvaluationReportValidation),
  updateEvaluationReport,
);

module.exports = router;

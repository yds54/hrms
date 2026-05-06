const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  createCriteria,
  getCriteria,
  deleteCriteria,
} = require("../controller/evaluationCriteriaController");

const {
  createCriteriaValidation,
  getCriteriaValidation,
  deleteCriteriaValidation,
} = require("../validation/evaluationCriteriaValidation");

//==================== ADD CRITERIA ====================
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(createCriteriaValidation),
  createCriteria,
);

//==================== GET CRITERIA ====================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getCriteriaValidation),
  getCriteria,
);

//==================== DELETE CRITERIA ====================
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN),
  validate(deleteCriteriaValidation),
  deleteCriteria,
);

module.exports = router;

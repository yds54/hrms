const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const { getLogs } = require("../controller/logsController");
const { getLogsValidation } = require("../validation/logsValidation");

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(getLogsValidation),
  getLogs,
);

module.exports = router;

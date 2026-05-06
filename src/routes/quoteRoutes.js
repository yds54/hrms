const express = require("express");
const router = express.Router();
const { validate } = require("express-validation");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const { getDailyQuote } = require("../controller/quoteController");
const { getDailyQuoteValidation } = require("../validation/quoteValidation");

//============= DISPLAY QUOTES ==================
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(...Object.values(ROLES)),
  validate(getDailyQuoteValidation),
  getDailyQuote,
);

module.exports = router;

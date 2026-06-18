const express = require("express");
const router = express.Router();

const {
  addBank,
  getAllBanks,
  updateBank,
  deleteBank,
  getBankById,
} = require("../controller/bankController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const { ROLES } = require("../utils/enum");

const {
  addBankValidation,
  getBankValidation,
  updateBankValidation,
  deleteBankValidation,
  getBankByIdValidation,
} = require("../validation/bankValidation");
const { validate } = require("express-validation");

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(addBankValidation),
  addBank,
);
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getBankValidation),
  getAllBanks,
);
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER),
  validate(getBankByIdValidation),
  getBankById,
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(updateBankValidation),
  updateBank,
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN, ROLES.HR),
  validate(deleteBankValidation),
  deleteBank,
);
module.exports = router;

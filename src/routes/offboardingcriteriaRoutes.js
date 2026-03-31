const express = require("express");
const router = express.Router();

const {addCriteria,getAllCriteria,updateCriteria,deleteCriteria}= require("../controller/offboardingcriteria");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const {addCriteriaValidation,getCriteriaValidation,deleteCriteriaValidation,updateCriteriaValidation} = require("../validation/offboarding.Validation");
const { validate } = require("express-validation");


router.post('/',authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(addCriteriaValidation),addCriteria)
router.get('/',authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(getCriteriaValidation),getAllCriteria)
router.put('/:id',authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(updateCriteriaValidation),updateCriteria)
router.delete('/:id',authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(deleteCriteriaValidation),deleteCriteria)


module.exports = router;
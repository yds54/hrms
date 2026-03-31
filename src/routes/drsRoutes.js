const express = require('express');
const router = express.Router();
const { validate } = require("express-validation");


const {authenticateJWT} = require('../middleware/authentication');
const {authorizeRoles} = require('../middleware/roleAuthorization');
const { ROLES } = require("../utils/enum");

const {addDrs , getDrs , updateDrs} = require('../controller/drsController');

const {drsValidation , getDrsValidation , updateDrsValidation,  } = require('../validation/drs.validation');

//==================== ADD DRS ===============================

router.post('/',authenticateJWT,authorizeRoles(ROLES.USER),validate(drsValidation),addDrs);

//==================== SHOW DRS ===============================

router.get("/show",authenticateJWT,authorizeRoles(ROLES.USER),validate(getDrsValidation),getDrs);

//======================== EDIT DRS =============================
router.put(
  "/:id",
  authenticateJWT,
  validate(updateDrsValidation),
  updateDrs
);




module.exports = router;
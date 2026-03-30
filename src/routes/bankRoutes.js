const express = require("express");
const router = express.Router();

const {addBank,getAllBanks}= require("../controller/bankController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const {
  
} = require("../validation/departmentValidation");
const { validate } = require("express-validation");


router.post("/",authenticateJWT,authorizeRoles(ROLES.ADMIN),addBank)
router.get("/",authenticateJWT,authorizeRoles(ROLES.ADMIN),getAllBanks)

module.exports =router
const express = require("express");
const router = express.Router();

const {addBank,getAllBanks,updateBank,deleteBank}= require("../controller/bankController");
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/roleAuthorization");
const {ROLES}= require("../utils/enum")

const {addBankValidation,getBankValidation,updateBankValidation,deleteBankValidation} = require("../validation/bankValidation");
const { validate } = require("express-validation");


router.post("/",authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(addBankValidation),addBank)
router.get("/",authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(getBankValidation),getAllBanks)
router.put("/:id",authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(updateBankValidation),updateBank)  
router.delete("/:id",authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(deleteBankValidation),deleteBank) 
module.exports =router
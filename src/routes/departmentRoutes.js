const express = require("express");
const router = express.Router();

const{addDepartment,updateDepartment,deleteDepartment,getAllDepartments} = require("../controller/departmentController")
const { authenticateJWT } = require("../middleware/authentication");
const { authorizeRoles, ROLES } = require("../middleware/roleAuthorization");
const {adddepartmentValidation,getdepartmentValidation} = require("../validation/departmentValidation");
const {validate} = require('express-validation')

router.post('/',authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(adddepartmentValidation),addDepartment)
router.get('/',authenticateJWT,authorizeRoles(ROLES.ADMIN),validate(getdepartmentValidation),getAllDepartments)
router.put('/:id',authenticateJWT,authorizeRoles(ROLES.ADMIN),updateDepartment)
router.delete('/:id',authenticateJWT,authorizeRoles(ROLES.ADMIN),deleteDepartment)

module.exports=router;
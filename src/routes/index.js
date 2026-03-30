const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const holidayRoutes = require("./holidayRoutes")
const departmentRoutes = require("./departmentRoutes")
const designationRoutes = require("./designationRoutes")


router.use("/users", userRoutes);
router.use("/holidays",holidayRoutes)
router.use("/departementes",departmentRoutes)
router.use("/designations",designationRoutes)
module.exports = router;

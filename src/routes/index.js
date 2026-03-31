const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const holidayRoutes = require("./holidayRoutes")
const departmentRoutes = require("./departmentRoutes")
const designationRoutes = require("./designationRoutes")
const bankRoutes = require("./bankRoutes")
const offboardingcriteriaRoutes = require("./offboardingcriteriaRoutes") 

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/holidays",holidayRoutes)
router.use("/departementes",departmentRoutes)
router.use("/designations",designationRoutes)
router.use("/banks",bankRoutes)
router.use("/criterias",offboardingcriteriaRoutes)
module.exports = router;

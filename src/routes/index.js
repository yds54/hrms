const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const holidayRoutes = require("./holidayRoutes")
const departmentRoutes = require("./departmentRoutes")


router.use("/users", userRoutes);
router.use("/holidays",holidayRoutes)
router.use("/departementes",departmentRoutes)
module.exports = router;

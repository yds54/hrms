const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const drsRoutes = require("./drsRoutes");
const leaveRoutes = require("./leaveRoutes");
const holidayRoutes = require("./holidayRoutes");
const departmentRoutes = require("./departmentRoutes");
const designationRoutes = require("./designationRoutes");
const bankRoutes = require("./bankRoutes");
const offboardingcriteriaRoutes = require("./offboardingcriteriaRoutes");
const organizationRoutes = require("./organizationRoutes");
const assetcategoryRoutes = require("./assetcategoryRoutes");
const assetRoutes = require("./assetRoutes");
const assetmanagementRoutes = require("./assetmanagementRoutes");
const ticketRoutes = require("./ticketRoutes");
const userpayrollRoutes = require("./userpayrollRoutes");
const incrementRoutes = require("./incrementRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/holidays", holidayRoutes);
router.use("/departementes", departmentRoutes);
router.use("/designations", designationRoutes);
router.use("/banks", bankRoutes);
router.use("/criterias", offboardingcriteriaRoutes);
router.use("/drs", drsRoutes);
router.use("/leaveRequest", leaveRoutes);
router.use("/ticket", ticketRoutes);
router.use("/organizations", organizationRoutes);
router.use("/assetcategories", assetcategoryRoutes);
router.use("/assets", assetRoutes);
router.use("/assetmanagement", assetmanagementRoutes);
router.use("/userpayroll", userpayrollRoutes);
router.use("/increments", incrementRoutes);

module.exports = router;

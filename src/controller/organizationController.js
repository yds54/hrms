const mongoose = require("mongoose");
require("dotenv").config();

const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { ORGANIZATION } = require("../model/modelIndex");
const { AppError } = require("../utils/error");


exports.addOrganization = async (req, res, next) => {
  try {
    const data = { ...req.body };

    const isExist = await ORGANIZATION.findOne({
      organizationName: data.organizationName,
      isDeleted: false,
    });

    if (isExist) {
      throw new AppError("Organization already exists", 409);
    }

    const organization = new ORGANIZATION(data);
    await organization.save();

    return successResponse(res, 200, "Organization added successfully", {
      organizationName: organization.organizationName,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


exports.getAllOrganizations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, organizationName } = req.query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (organizationName) {
      _whereCondition.organizationName = {
        $regex: organizationName,
        $options: "i",
      };
    }

    const { data, pagination } = await paginate({
      model: ORGANIZATION,
      query: _whereCondition,
      page: Number(page),
      limit: Number(limit),
    });

    return successResponse(res, 200, "Organizations fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};


exports.getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!organization) {
      throw new AppError("Organization not found", 404);
    }

    return successResponse(res, 200, "Organization fetched successfully", {
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};


exports.updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const organization = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!organization) {
      throw new AppError("Organization not found", 404);
    }

    if (data.organizationName) {
      const exists = await ORGANIZATION.findOne({
        organizationName: data.organizationName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (exists) {
        throw new AppError("Organization already exists", 409);
      }

      organization.organizationName = data.organizationName;
    }

    if (data.headHR) organization.headHR = data.headHR;
    if (data.organizationAddress) organization.organizationAddress = data.organizationAddress;
    if (data.logo) organization.logo = data.logo;
    if (data.organizationAccountNumber) organization.organizationAccountNumber = data.organizationAccountNumber;

    if (data.irregularEmployeeCriteria) {
      organization.irregularEmployeeCriteria = {
        ...organization.irregularEmployeeCriteria,
        ...data.irregularEmployeeCriteria,
      };
    }

    organization.updatedBy = req.user?.id || null;

    await organization.save();

    return successResponse(res, 200, "Organization updated successfully", {
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!organization) {
      throw new AppError("Organization not found", 404);
    }

    organization.isDeleted = true;
    organization.deletedBy = req.user?.id || null;

    await organization.save();

    return successResponse(res, 200, "Organization deleted successfully");
  } catch (error) {
    next(error);
  }
};
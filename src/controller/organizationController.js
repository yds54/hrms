const mongoose = require("mongoose");
require("dotenv").config();

const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { ORGANIZATION } = require("../model/modelIndex");
const { AppError } = require("../utils/error");

exports.addOrganization = async (req, res, next) => {
  try {
    const { body, file } = req;

    if (file) {
      body.logo = `/uploads/organizationLogo/${file.filename}`;
    }
    const isOrganizationExists = await ORGANIZATION.findOne({
      organizationName: body.organizationName,
      isDeleted: false,
    }).select("_id");

    if (isOrganizationExists) {
      throw new AppError("Organization already exists", 409);
    }

    body.createdBy = req.user._id;
    await ORGANIZATION.create(body);

    return successResponse(res, 200, "Organization added successfully", {
      organizationName: body.organizationName,
    });
  } catch (error) {
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
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
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

    const isOrganizationExists = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isOrganizationExists) {
      throw new AppError("Organization not found", 404);
    }

    return successResponse(res, 200, "Organization fetched successfully", {
      data: isOrganizationExists,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrganization = async (req, res, next) => {
  try {
    const { params, body: payload, file } = req;
    const { id } = params;

    if (file) {
      payload.logo = `/uploads/organizationLogo/${file.filename}`;
    }

    const isOrganizationExists = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isOrganizationExists) {
      throw new AppError("Organization not found", 404);
    }

    if (isOrganizationExists) {
      const organizationExists = await ORGANIZATION.findOne({
        organizationName: payload.organizationName,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (organizationExists) {
        throw new AppError("Organization already exists", 409);
      }
    }
    await ORGANIZATION.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
    );
    return successResponse(res, 200, "Organization updated successfully", {
      data: payload.organizationName,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isOrganizationExists = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!isOrganizationExists) {
      throw new AppError("Organization not found", 404);
    }

    isOrganizationExists.isDeleted = true;
    isOrganizationExists.deletedAt = moment().toDate();

    await isOrganizationExists.save();

    return successResponse(res, 200, "Organization deleted successfully");
  } catch (error) {
    next(error);
  }
};

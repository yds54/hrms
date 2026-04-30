const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { ORGANIZATION } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { getFileUrl } = require("../utils/fileUrl");

exports.addOrganization = async (req, res, next) => {
  try {
    const { body, file } = req;

    const isOrganizationExists = await ORGANIZATION.findOne({
      organizationName: body.organizationName,
      isDeleted: false,
    }).select("_id");

    if (isOrganizationExists) {
      throw new AppError("Organization already exists", 409);
    }

    body.createdBy = req.user._id;

    if (file?.cloudinaryData) {
      body.logo = {
        fileName: file.cloudinaryData.path.split("/").pop(),
        fileType: file.mimetype,
        size: Math.round(file.size / 1024),
      };
    }

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
    const { page, limit, organizationName } = req.query;

    const _whereCondition = { isDeleted: false };

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

    const formattedData = data.map((org) => {
      const item = org.toObject();

      if (item.logo?.fileName) {
        item.logo.url = getFileUrl(`organizationLogo/${item.logo.fileName}`);
      }

      return item;
    });

    return successResponse(res, 200, "Organizations fetched successfully", {
      data: formattedData,
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
    }).select("_id organizationName logo");

    if (!organization) {
      throw new AppError("Organization not found for given ID", 404);
    }

    const data = organization.toObject();

    if (data.logo?.fileName) {
      data.logo.url = getFileUrl(`organizationLogo/${data.logo.fileName}`);
    }

    return successResponse(res, 200, "Organization fetched successfully", {
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrganization = async (req, res, next) => {
  try {
    const { params, body: payload, file } = req;
    const { id } = params;

    const organization = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");

    if (!organization) {
      throw new AppError("Organization not found for given ID", 404);
    }

    const duplicate = await ORGANIZATION.findOne({
      organizationName: payload.organizationName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (duplicate) {
      throw new AppError("Organization already exists", 409);
    }

    if (file?.cloudinaryData) {
      payload.logo = {
        fileName: file.cloudinaryData.path.split("/").pop(),
        fileType: file.mimetype,
        size: Math.round(file.size / 1024),
      };
    }

    await ORGANIZATION.updateOne({ _id: id }, { $set: payload });

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

    const organization = await ORGANIZATION.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!organization) {
      throw new AppError("Organization not found for given ID", 404);
    }

    organization.isDeleted = true;
    organization.deletedAt = moment().toDate();

    await organization.save();

    return successResponse(res, 200, "Organization deleted successfully");
  } catch (error) {
    next(error);
  }
};

require("dotenv").config();
const moment = require("moment");
const { paginate } = require("../utils/pagination");
const cloudinary = require("../config/cloudinary");
const { successResponse } = require("../utils/sucess");
const { USER } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const {
  uploadToCloudinary,
  cleanupLocalFile,
  deleteFromCloudinary,
} = require("../utils/cloudinaryHelper");
const { getFileUrl } = require("../utils/fileUrl");
const { ROLES } = require("../utils/enum");

//============= DISPLAY USERS =================
exports.viewallUser = async (req, res, next) => {
  try {
    const { user, query } = req;

    const {
      page,
      limit,
      gender,
      designation,
      organizationId,
      attendanceType,
      id,
      search,
      Left,
    } = query;

    const _whereCondition = {
      isDeleted: false,
      isLeft: false,
    };

    if (user.role !== ROLES.ADMIN) {
      _whereCondition._id = user.id;
    } else if (id) {
      _whereCondition._id = id;
    }

    if (gender) _whereCondition.gender = gender;
    if (designation) _whereCondition.designationId = designation;
    if (organizationId) _whereCondition.organizationId = organizationId;
    if (attendanceType) _whereCondition.attendanceType = attendanceType;

    if (Left === "true") {
      _whereCondition.isLeft = true;
    }

    if (search) {
      const fields = [
        "name.firstName",
        "name.middleName",
        "name.lastName",
        "email",
        "employeeCode",
        "gender",
        "contactNumber",
        "role",
      ];

      _whereCondition.$or = fields.map((field) => ({
        [field]: {
          $regex: search,
          $options: "i",
        },
      }));
    }

    const { data, pagination } = await paginate({
      model: USER,
      query: _whereCondition,
      populate: [
        {
          path: "designationId",
          select: "designationName",
          match: { isDeleted: false },
        },
        {
          path: "departmentId",
          select: "departmentName",
          match: { isDeleted: false },
        },
        {
          path: "bankDetails.bankId",
          select: "bankName",
          match: { isDeleted: false },
        },
        {
          path: "organizationId",
          select: "organizationName",
          match: { isDeleted: false },
        },
      ],
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    const formattedData = data.map((item) => {
      const userObj = item.toObject ? item.toJSON() : { ...item };

      if (userObj.profilePicture?.fileName) {
        userObj.profilePicture = {
          ...userObj.profilePicture,
          url: getFileUrl(`profile/${userObj.profilePicture.fileName} `),
        };
      }

      return userObj;
    });

    return successResponse(res, 200, "User fetched successfully", {
      data: formattedData,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};
//================ UPDATE PROFILE ==============

exports.updateUser = async (req, res, next) => {
  let uploadedFilePublicId = null;

  try {
    const { params, body: payload, file, user } = req;
    const { id } = params;

    const isUserExists = await USER.findOne(
      {
        _id: id,
        isDeleted: false,
      },
      "_id profilePicture email contactNumber",
    );

    if (!isUserExists) {
      throw new AppError("User not found with ID", 404);
    }

    const isAdmin = user?.role === ROLES.ADMIN;

    if (!isAdmin) {
      const allowedFields = ["profilePicture"];

      const invalidFields = Object.keys(payload).filter(
        (key) => !allowedFields.includes(key),
      );

      if (invalidFields.length) {
        throw new AppError("You can only update profile picture", 403);
      }
    }

    if (
      isAdmin &&
      (payload.email !== isUserExists.email ||
        payload.contactNumber !== isUserExists.contactNumber)
    ) {
      const existingUsers = await USER.findOne({
        _id: { $ne: id },
        isDeleted: false,
        $or: [
          payload.email && { email: payload.email },
          payload.contactNumber && { contactNumber: payload.contactNumber },
        ].filter(Boolean),
      });

      if (existingUsers) {
        throw new AppError("Email or mobile number already exists", 409);
      }
    }

    if (file) {
      const uploadedFile = await uploadToCloudinary(file, {
        folder: "profile",
      });

      uploadedFilePublicId = uploadedFile.publicId;

      payload.profilePicture = uploadedFile;
    }

    await USER.updateOne({ _id: id, isDeleted: false }, { $set: payload });

    if (uploadedFilePublicId && isUserExists.profilePicture?.fileName) {
      await deleteFromCloudinary(
        `profile/${isUserExists.profilePicture.fileName}`,
      );
    }

    return successResponse(res, 200, "User changed successfully", {
      data: payload,
    });
  } catch (error) {
    await deleteFromCloudinary(uploadedFilePublicId);

    cleanupLocalFile(req.file?.path);

    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id: userID } = req.params;

    const isUserExists = await USER.findOne({
      _id: userID,
      isDeleted: false,
    }).select("_id profilePicture");

    if (!isUserExists) {
      throw new AppError("User not found for given ID", 404);
    }

    isUserExists.isDeleted = true;
    isUserExists.deletedAt = moment().toDate();

    await isUserExists.save();

    if (isUserExists.profilePicture?.fileName) {
      await deleteFromCloudinary(
        `profile/${isUserExists.profilePicture.fileName}`,
      );
    }

    return successResponse(res, 200, "User deleted successfully");
  } catch (error) {
    console.error("Delete user Error", error);
    next(error);
  }
};

//================ DISPLAY PROFILE BY ID ====================
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUserExists = await USER.findOne({
      _id: id,
      isDeleted: false,
    }).populate([
      {
        path: "departmentId",
        select: "departmentName",
        match: { isDeleted: false },
      },
      {
        path: "designationId",
        select: "designationName",
        match: { isDeleted: false },
      },
      {
        path: "organizationId",
        select: "organizationName",
        match: { isDeleted: false },
      },
      {
        path: "bankDetails.bankId",
        select: "bankName",
        match: { isDeleted: false },
      },
    ]);

    if (!isUserExists) {
      throw new AppError("User not found for given ID", 404);
    }

    const formattedUser = isUserExists.toJSON();

    if (formattedUser.profilePicture?.fileName) {
      formattedUser.profilePicture.url = getFileUrl(
        `profile/${formattedUser.profilePicture.fileName}`,
        formattedUser.profilePicture.fileName,
      );
    }

    return successResponse(res, 200, "User fetched successfully", {
      data: formattedUser,
    });
  } catch (error) {
    next(error);
  }
};

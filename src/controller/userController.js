require("dotenv").config();
const moment = require("moment");
const { paginate } = require("../utils/pagination");
const cloudinary = require("../config/cloudinary");
const { searchConditions } = require("../utils/searchHelper");
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
      department,
      attendanceType,
      id,
      search,
      Left,
      role,
    } = query;

    const _whereCondition = {
      isDeleted: false,
      isLeft: false,
    };

    const allowedRoles = [ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER];
    if (!allowedRoles.includes(user.role)) {
      _whereCondition._id = user.id;
    } else if (id) {
      _whereCondition._id = id;
    }

    if (gender) _whereCondition.gender = gender;
    if (designation) _whereCondition.designationId = designation;
    if (organizationId) _whereCondition.organizationId = organizationId;
    if (attendanceType) _whereCondition.attendanceType = attendanceType;
    if (department) _whereCondition.departmentId = department;
    if (role === "tl") {
      _whereCondition.role = {
        $in: [ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD],
      };
    } else if (role === "all") {
      _whereCondition.role = {
        $nin: [ROLES.ADMIN, ROLES.HR, ROLES.HR_RECRUITER],
      };
    } else if (role) {
      _whereCondition.role = role;
    }

    if (Left === "true") {
      _whereCondition.isLeft = true;
    }

    if (search) {
      _whereCondition.$or = [
        searchConditions(search, "fullName"),

        { email: { $regex: search, $options: "i" } },
        { employeeCode: { $regex: search, $options: "i" } },
        { gender: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
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
    if (payload.name) {
      const name = {
        ...isUserExists.name?.toObject?.(),
        ...payload.name,
      };

      payload.fullName = Object.values(name)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
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

exports.gstAllUsersByOrganization = async (req, res, next) => {
  try {
    const { user, query } = req;
    const { page, limit, search } = query;

    const _whereCondition = {
      _id: { $ne: user.id },
      isDeleted: false,
      isLeft: false,
      status: "active",
      organizationId: user.organizationId,
    };

    if (search) {
      const searchWords = search.trim().split(/\s+/);

      _whereCondition.$and = searchWords.map((word) => ({
        $or: [
          {
            "name.firstName": {
              $regex: word,
              $options: "i",
            },
          },
          {
            "name.middleName": {
              $regex: word,
              $options: "i",
            },
          },
          {
            "name.lastName": {
              $regex: word,
              $options: "i",
            },
          },
          {
            employeeCode: {
              $regex: word,
              $options: "i",
            },
          },
        ],
      }));
    }

    const { data, pagination } = await paginate({
      model: USER,
      query: _whereCondition,
      select: {
        employeeCode: 1,
        name: 1,
        profilePicture: 1,
      },
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    const formattedData = data.map((userObj) => {
      return {
        ...userObj._doc,
        profilePictureUrl: userObj.profilePicture?.fileName
          ? getFileUrl(`profile/${userObj.profilePicture.fileName}`)
          : null,
      };
    });

    return successResponse(
      res,
      200,
      "Organization users fetched successfully",
      {
        data: formattedData,
        pagination,
      },
    );
  } catch (error) {
    next(error);
  }
};

exports.getRandomUsers = async (req, res, next) => {
  try {
    const { user, query } = req;

    const { page, limit } = query;

    const _whereCondition = {
      _id: { $ne: user.id },
      isDeleted: false,
      isLeft: false,
      status: "active",
    };

    const pipeline = [
      {
        $match: _whereCondition,
      },
      {
        $sample: {
          size: +limit,
        },
      },
      {
        $project: {
          employeeCode: 1,
          role: 1,
          name: 1,
          profilePicture: 1,
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: USER,
      pipeline,
      page: +page,
      limit: +limit,
    });

    const formattedData = data.map((userObj) => ({
      ...userObj,
      profilePictureUrl: userObj.profilePicture?.fileName
        ? getFileUrl(`profile/${userObj.profilePicture.fileName}`)
        : null,
    }));

    return successResponse(
      res,
      200,
      "Random organization users fetched successfully",
      {
        data: formattedData,
        pagination,
      },
    );
  } catch (error) {
    next(error);
  }
};

exports.userInfo = async (req, res, next) => {
  try {
    const { user } = req;

    const data = await USER.findOne({
      _id: user.id,
      isDeleted: false,
      isLeft: false,
    })
      .select("fullName email designationId")
      .populate({
        path: "designationId",
        select: "designationName",
        match: {
          isDeleted: false,
        },
      });

    const formattedData = {
      userName: data.fullName,
      userDesignation: data.designationId.designationName,
      email: data.email,
    };

    return successResponse(res, 200, "User info fetched successfully", {
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

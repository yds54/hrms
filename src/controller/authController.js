require("dotenv").config();
const moment = require("moment");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { successResponse } = require("../utils/sucess");
const { USER, AUTH } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const {
  uploadToCloudinary,
  cleanupLocalFile,
  deleteFromCloudinary,
} = require("../utils/cloudinaryHelper");
const { USER_STATUS } = require("../utils/enum");
const { renameFile } = require("../utils/fileHandler");
const cloudinary = require("../config/cloudinary");
const { sendMail } = require("../utils/sendMail");

exports.registerUser = async (req, res, next) => {
  let uploadedFilePublicId = null;

  try {
    const { body, file } = req;

    delete body.confirmPassword;

    const isUserExists = await USER.findOne({
      email: body.email,
      contactNumber: body.contactNumber,
      isDeleted: false,
    }).select("email isDeleted contactNumber");

    if (isUserExists) {
      throw new AppError(
        "User already exists with given email or contact number",
        409,
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    body.password = hashedPassword;

    const lastUser = await USER.findOne({
      employeeCode: { $exists: true },
    })
      .sort({ employeeCode: -1 })
      .select("employeeCode");

    let nextNumber = 1;

    if (lastUser?.employeeCode) {
      const num = parseInt(lastUser.employeeCode.replace("BS", ""));
      nextNumber = num + 1;
    }

    body.employeeCode = `BS${String(nextNumber).padStart(3, "0")}`;

    if (file) {
      const uploadedFile = await uploadToCloudinary(file, {
        folder: "profile",
      });

      uploadedFilePublicId = uploadedFile.publicId;

      body.profilePicture = uploadedFile;
    }

    await USER.create(body);

    return successResponse(res, 200, "User Registered Successfully", {
      employeeCode: body.employeeCode,
    });
  } catch (error) {
    await deleteFromCloudinary(uploadedFilePublicId);

    cleanupLocalFile(req.file?.path);

    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const isUserExists = await USER.findOne({
      email,
      status: USER_STATUS.ACTIVE,
      isDeleted: false,
    }).select("+password");

    if (!isUserExists) {
      throw new AppError("Email or password is incorrect", 500);
    }

    const isPassMatch = await bcrypt.compare(password, isUserExists.password);

    if (!isPassMatch) {
      throw new AppError("Email or password is incorrect", 500);
    }

    const token = jwt.sign(
      {
        id: isUserExists._id,
        role: isUserExists.role,
      },
      process.env.secrate_jwt,
      { expiresIn: "1h" },
    );

    await AUTH.create({
      user: isUserExists._id,
      token,
      expiresAt: moment().add(1, "hour").toDate(),
    });

    return successResponse(res, 200, "Login successful", { token });
  } catch (error) {
    next(error);
  }
};

//================ LOGOUT ====================
exports.logoutUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    await AUTH.updateOne(
      { token, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
    );

    return successResponse(res, 200, "Logout successful");
  } catch (error) {
    next(error);
  }
};

//================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const isUserExists = await USER.findOne({
      email,
      isDeleted: false,
    }).select("_id");

    if (!isUserExists) throw new AppError("User not found", 404);

    const token = crypto.randomBytes(32).toString("hex");

    await AUTH.create({
      user: isUserExists._id,
      token,
      expiresAt: moment().add(15, "minutes").toDate(),
    });

    const resetUrl = `${process.env.FRONTEND_URL}/change-password/${token}`;

    await sendMail({
      to: email,
      subject: "Reset Password",
      html: `
        <h3>Reset Password</h3>
        <p>Click below link to reset password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });

    return successResponse(res, 200, "Reset link sent to email");
  } catch (err) {
    next(err);
  }
};

//==================== CHANGE PASSWORD ==================
exports.changePassword = async (req, res, next) => {
  try {
    const {
      user,
      body: { newPassword, token },
    } = req;

    let userId;

    if (user?._id) {
      userId = user._id;
    } else if (token) {
      const auth = await AUTH.findOne({
        token,
        isDeleted: false,
        expiresAt: { $gt: moment().toDate() },
      });
      if (!auth) throw new AppError("Invalid or expired token", 400);
      userId = auth.user;

      await AUTH.updateOne({ _id: auth._id }, { isDeleted: true });
    } else {
      throw new AppError("You are not authorize to change password", 401);
    }

    await USER.updateOne(
      { _id: userId },
      { password: await bcrypt.hash(newPassword, 10) },
    );

    return successResponse(res, 200, "Password changed successfully");
  } catch (err) {
    next(err);
  }
};

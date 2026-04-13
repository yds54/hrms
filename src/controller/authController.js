const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { successResponse } = require("../utils/sucess");
const { USER, AUTH } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { USER_STATUS } = require("../utils/enum");

exports.registerUser = async (req, res, next) => {
  try {
    const { body, file } = req;

    delete body.confirmPassword;

    if (file) {
      body.profilePicture = `/uploads/profile/${file.filename}`;
    }

    const isUserExist = await USER.findOne({
      email: body.email,
      contactNumber: body.contactNumber,
      isDeleted: false,
    }).select("email isDeleted contactNumber");

    if (isUserExist) {
      throw new AppError(
        "User already exists with this email or contact number",
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

    if (lastUser && lastUser.employeeCode) {
      const num = parseInt(lastUser.employeeCode.replace("BS", ""));
      nextNumber = num + 1;
    }

    body.employeeCode = `BS${String(nextNumber).padStart(3, "0")}`;

    await USER.create(body);

    return successResponse(res, 200, "User Registered Successfully", {
      employeeCode: body.employeeCode,
    });
  } catch (error) {
    next(error);
  }
};

//================= LOGIN ======================================
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const isUserExist = await USER.findOne({
      email,
      status: USER_STATUS.ACTIVE,
      isDeleted: false,
    }).select("+password");

    if (!isUserExist) {
      throw new AppError("Invalid credentials", 500);
    }

    const isPassMatch = await bcrypt.compare(password, isUserExist.password);

    if (!isPassMatch) {
      throw new AppError("Invalid credentials", 500);
    }

    const token = jwt.sign(
      {
        id: isUserExist._id,
        role: isUserExist.role,
      },
      process.env.secrate_jwt,
      { expiresIn: "1h" },
    );

    await AUTH.create({
      user: isUserExist._id,
      token,
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
      },
    );

    return successResponse(res, 200, "Logout successful");
  } catch (error) {
    next(error);
  }
};

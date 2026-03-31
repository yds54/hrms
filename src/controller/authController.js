const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { Roles } = require("../utils/enum");
const { USER } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { USER_STATUS } = require("../utils/enum");


exports.registerUser = async (req, res, next) => {
  try {
    const data = { ...req.body };

    delete data.confirmPassword;

    if (req.file) {
      data.profilePicture = `/uploads/${req.file.filename}`;
    }

    const isUserExist = await USER.findOne({
      email: data.email,
      isDeleted: false,
    });

    if (isUserExist) {
      throw new AppError("User already exists with this email", 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    if (!data.employeeCode) {
      const lastUser = await USER.findOne({
        employeeCode: { $exists: true },
      }).sort({ createdAt: -1 });

      let nextNumber = 1;

      if (lastUser && lastUser.employeeCode) {
        const num = parseInt(lastUser.employeeCode.replace("BS", ""));
        nextNumber = num + 1;
      }

      data.employeeCode = `BS${String(nextNumber).padStart(3, "0")}`;
    }

    const user = new USER(data);

    await user.save();

    return successResponse(res, 200, "User Registered Successfully", {
      id: user._id,
      employeeCode: user.employeeCode,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await USER.findOne({
      email,
      status: USER_STATUS.ACTIVE,
      isDeleted: false,
    }).select("+password");

    if (!user) {
      throw new AppError("Invalid credentials", 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppError("Invalid credentials", 400);
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.secrate_jwt,
      { expiresIn: "1h" },
    );

    return successResponse(res, 200, "Login successful",  { token });
  } catch (error) {
    next(error);
  }
};
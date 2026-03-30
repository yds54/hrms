const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { Roles } = require("../utils/enum");
const { User } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { USER_STATUS } = require("../utils/enum");


exports.registerUser = async (req, res, next) => {
  try {
    const data = { ...req.body };

    delete data.confirmPassword;

    if (req.file) {
      data.profilePicture = `/uploads/${req.file.filename}`;
    }

    const isUserExist = await User.findOne({
      email: data.email,
      isDeleted: false,
    });

    if (isUserExist) {
      throw new AppError("User already exists with this email", 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    if (!data.employeeCode) {
      const lastUser = await User.findOne({
        employeeCode: { $exists: true },
      }).sort({ createdAt: -1 });

      let nextNumber = 1;

      if (lastUser && lastUser.employeeCode) {
        const num = parseInt(lastUser.employeeCode.replace("BS", ""));
        nextNumber = num + 1;
      }

      data.employeeCode = `BS${String(nextNumber).padStart(3, "0")}`;
    }

    const user = new User(data);

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

    const user = await User.findOne({
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

    return successResponse(res, 200, "Login successful", {
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.viewallUser = async (req, res, next) => {
  try {
    const { user, query } = req;
    const { page = 1, limit = 10, gender, designation,organizationType,attendanceType, id ,Left} = query;

    const _whereCondition = { isDeleted: false ,role:"user"};

    if (gender) _whereCondition["gender"] = gender;
    if (id) _whereCondition["_id"] = id;
    if (designation) _whereCondition["designation"] = designation;
    if (organizationType) _whereCondition["organizationType"] = organizationType;
    if (attendanceType) _whereCondition["attendanceType"] = attendanceType;
    if (Left === "true") {
      _whereCondition.isLeft = true;
    } else if (Left === "false") {
      _whereCondition.isLeft = false;
    }



    const { data, pagination } = await paginate({
      model: User,
      query: _whereCondition,
      page: Number(page),
      limit: Number(limit),
    });

    return successResponse(res, 200, "User fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};


exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    delete data.employeeCode;

    if (req.file) {
      data.profilePicture = `/uploads/${req.file.filename}`;
    }

    const existingUser = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updateData = {};

    const flattenObject = (obj, parentKey = "") => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const newKey = parentKey ? `${parentKey}.${key}` : key;

        if (value && typeof value === "object" && !Array.isArray(value)) {
          flattenObject(value, newKey);
        } else {
          updateData[newKey] = value;
        }
      });
    };

    flattenObject(data);

    updateData.isUpdated = true;
    if (req.user) {
      updateData.updatedBy = req.user.id;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return successResponse(res, 200, "User updated successfully", {
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async(req,res,next)=>{
  try{
      const{id:userID}= req.params;

      const user = await User.findById(userID);

      if(!user||user.isDeleted)
      throw new AppError("User not found", 404);
      
      user.isDeleted=true;
      await user.save()

      return successResponse(res,200,"User deleted sucessfully");

  }
  catch(error)
  {
    console.error("Delete user Error",error)
    next(error)
  }
}

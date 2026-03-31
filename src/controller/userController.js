const bcrypt = require("bcryptjs");
require("dotenv").config();
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USER } = require("../model/modelIndex");
const { getProjection} = require("../utils/projection");


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
      model: USER,
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

    const existingUser = await USER.findOne({
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

   // updateData.isUpdated = true;
    if (req.user) {
      updateData.updatedBy = req.user.id;
    }

    const updatedUser = await USER.findByIdAndUpdate(
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

      const user = await USER.findById(userID);

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



//================= VIEW PROFILE ===================================

exports.viewUser = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const user = await USER.findOne({
      _id,
      isDeleted: false,
    }).select(getProjection(["password","status","isLeft"]));

    if (!user) {
      return next(new Error("User not found"));
    }

    const userObj = user.toObject({ virtuals: true });

    return successResponse(res, 200, "User fetched successfully", userObj);
  } catch (error) {
    next(error);
  }
};

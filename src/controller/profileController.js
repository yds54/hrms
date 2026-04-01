require("dotenv").config();
const { successResponse } = require("../utils/sucess");
const { USER } = require("../model/modelIndex");
const { getProjection} = require("../utils/projection");



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

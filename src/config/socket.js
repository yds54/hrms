const jwt = require("jsonwebtoken");
const moment = require("moment");
const { USER, AUTH } = require("../model/modelIndex");
const { USER_STATUS } = require("../utils/enum");

const socketAuth = async (socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const headerToken = socket.handshake.headers?.authorization?.split(" ")[1];
    const token = authToken?.startsWith("Bearer ")
      ? authToken.split(" ")[1]
      : authToken || headerToken;

    if (!token) {
      return next(new Error("No authentication token provided"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.secrate_jwt);
    } catch (jwtError) {
      return next(new Error(`Invalid token: ${jwtError.message}`));
    }

    const user = await USER.findOne({
      _id: decoded.id,
      status: USER_STATUS.ACTIVE,
      isDeleted: false,
      isLeft: false,
    }).select("_id organizationId role");

    if (!user) {
      return next(
        new Error("User not found, inactive, or has left the organization"),
      );
    }

    socket.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role,
    };
    socket.organizationId = user.organizationId;
    next();
  } catch (error) {
    next(
      new Error(
        `Server authentication error: ${error.message || "Unknown error"}`,
      ),
    );
  }
};

module.exports = { socketAuth };

const { ROLES } = require("../utils/enum");

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 403,
        statusState: "error",
        message: " You do not have permission to perform this action",
        data: [],
      });
    }
    next();
  };
}

module.exports = { authorizeRoles, ROLES };

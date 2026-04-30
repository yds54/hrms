const cloudinary = require("../config/cloudinary");

const getFileUrl = (path) => {
  if (!path) return null;

  return cloudinary.url(path, {
    secure: true,
  });
};

module.exports = { getFileUrl };

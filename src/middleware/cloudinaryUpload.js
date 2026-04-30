const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const cloudinaryUpload = (options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = options.useUserFolder
        ? req.body?.userId || req.user?._id
        : null;

      const baseFolder = options.folder || "uploads";
      const folder = userId ? `${baseFolder}/${userId}` : baseFolder;

      const uploadSingle = async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: "auto",
        });

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return {
          path: result.public_id,
        };
      };

      if (req.file) {
        req.file.cloudinaryData = await uploadSingle(req.file);
      }

      if (req.files) {
        const uploadedFiles = {};

        for (const field in req.files) {
          uploadedFiles[field] = [];

          for (const file of req.files[field]) {
            uploadedFiles[field].push(await uploadSingle(file));
          }
        }

        req.uploadedFiles = uploadedFiles;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = cloudinaryUpload;

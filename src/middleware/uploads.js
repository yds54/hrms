const moment = require("moment");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (folderName, options = {}) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let dir = path.join(__dirname, `../uploads/${folderName}`);

      const userId = options.useUserFolder
        ? req.body?.userId || req.user?._id
        : null;

      if (userId) {
        dir = path.join(dir, userId.toString());
      }

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);

      let fileName;

      if (options.useTimestamp) {
        fileName = `${moment().format(
          "YYYY-MM-DD_HH-mm-ss-SSS",
        )}-${file.fieldname}${ext}`;
      } else {
        const basename = path.basename(file.originalname, ext);
        fileName = `${basename}-${Date.now()}${ext}`;
      }

      cb(null, fileName);
    },
  });

  return multer({ storage });
};

module.exports = createUploader;

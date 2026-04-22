const moment = require("moment");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (folderName, options = {}) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let dir = path.join(__dirname, `../uploads/${folderName}`);
      if (options.useUserFolder && req.user?._id) {
        dir = path.join(dir, req.user._id.toString());
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      if (options.useTimestamp) {
        const timestamp = `${moment().format("YYYY-MM-DD_HH-mm-ss-SSS")}-${file.fieldname}`;
        return cb(null, `${timestamp}${ext}`);
      }
      const basename = path.basename(file.originalname, ext);
      cb(null, `${basename}-${Date.now()}${ext}`);
    },
  });

  return multer({
    storage,
  });
};

module.exports = createUploader;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (folderName) => {
  const dir = path.join(__dirname, `../uploads/${folderName}`);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      cb(null, `${basename}-${Date.now()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
  });
};

module.exports = createUploader;
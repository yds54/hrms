const multer = require("multer");
const path = require("path");
const { ValidationError, AppError } = require("../utils/error");

const dir = path.join(__dirname, "../uploads");

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

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new AppError("Only image files are allowed!", 400));
//   }
// };

const upload = multer({
  storage,
  //fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;

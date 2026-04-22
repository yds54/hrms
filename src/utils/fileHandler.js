const fs = require("fs");
const path = require("path");

const renameFile = async (file, newName, folder) => {
  if (!file) return "";

  const ext = path.extname(file.originalname);

  const newFileName = `${newName}${ext}`;

  const newPath = path.join(__dirname, `../uploads/${folder}/${newFileName}`);

  await fs.promises.rename(file.path, newPath);

  return `/uploads/${folder}/${newFileName}`;
};

module.exports = { renameFile };

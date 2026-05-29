const fs = require("fs");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (file, options = {}) => {
  if (!file) return null;

  const userId = options.useUserFolder ? options.userId : null;

  const baseFolder = options.folder || "uploads";
  const folder = userId ? `${baseFolder}/${userId}` : baseFolder;

  const result = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "auto",
  });

  cleanupLocalFile(file.path);

  return {
    publicId: result.public_id,
    fileName: result.public_id.split("/").pop(),
    fileType: file.mimetype,
    size: Math.round(file.size / 1024),
  };
};

const uploadMultipleToCloudinary = async (filesObj, options = {}) => {
  if (!filesObj) return {};

  const uploadedFiles = {};

  for (const field in filesObj) {
    uploadedFiles[field] = [];

    for (const file of filesObj[field]) {
      const uploaded = await uploadToCloudinary(file, options);
      uploadedFiles[field].push(uploaded);
    }
  }

  return uploadedFiles;
};

const cleanupLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const cleanupMultipleLocalFiles = (filesObj = {}) => {
  for (const field in filesObj) {
    for (const file of filesObj[field]) {
      cleanupLocalFile(file.path);
    }
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
};

const deleteMultipleFromCloudinary = async (publicIds = []) => {
  for (const publicId of publicIds) {
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }
};

const deleteFolderFromCloudinary = async (folderPath) => {
  if (!folderPath) return;

  await cloudinary.api.delete_resources_by_prefix(folderPath);
  await cloudinary.api.delete_folder(folderPath);
};

const uploadMultipleFilesSingleField = async (files = [], options = {}) => {
  if (!files?.length) return [];
  const uploadedFiles = [];
  for (const file of files) {
    const uploaded = await uploadToCloudinary(file, options);
    uploadedFiles.push(uploaded);
  }
  return uploadedFiles;
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  cleanupLocalFile,
  cleanupMultipleLocalFiles,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  deleteFolderFromCloudinary,
  uploadMultipleFilesSingleField,
};

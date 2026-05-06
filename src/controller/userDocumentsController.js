const moment = require("moment");
const cloudinary = require("../config/cloudinary");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USER_DOCUMENT, USER } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { getFileUrl } = require("../utils/fileUrl");
const {
  uploadMultipleToCloudinary,
  cleanupMultipleLocalFiles,
  deleteMultipleFromCloudinary,
  deleteFolderFromCloudinary,
} = require("../utils/cloudinaryHelper");

const buildFileObject = (uploadedFile, originalFile = null, remark = "") => ({
  fileName: uploadedFile?.path?.replace(/^userDocuments\//, "") || null,
  fileType: originalFile?.mimetype || null,
  size: Math.round(originalFile.size / 1024),
  remark,
});

const documentFields = [
  "offerLetter",
  "appointmentLetter",
  "tenthMarksheet",
  "twelfthOrDiplomaMarksheet",
  "bachelorsCertificate",
  "mastersDegreeMarksheet",
  "panCard",
];

exports.addUserDocuments = async (req, res, next) => {
  const uploadedFilesPublicIds = [];

  try {
    const { body, files: multerFiles } = req;

    const isUserExists = await USER.findOne({
      _id: body.userId,
      isDeleted: false,
    }).select("_id");

    if (!isUserExists) {
      throw new AppError("User not found for given userId", 404);
    }

    const isUserDocumentsExists = await USER_DOCUMENT.findOne({
      userId: body.userId,
      isDeleted: false,
    }).select("_id");

    if (isUserDocumentsExists) {
      throw new AppError("Documents already exist for this user", 409);
    }

    let otherDocs = null;

    if (multerFiles?.otherDocuments?.length && body.otherDocuments) {
      try {
        otherDocs =
          typeof body.otherDocuments === "string"
            ? JSON.parse(body.otherDocuments)
            : body.otherDocuments;
      } catch {
        throw new AppError("Invalid otherDocuments JSON format", 400);
      }

      if (otherDocs.length !== multerFiles.otherDocuments.length) {
        throw new AppError(
          "otherDocuments metadata count must match uploaded files count",
          400,
        );
      }
    }

    const uploadedFiles = await uploadMultipleToCloudinary(multerFiles, {
      folder: "userDocuments",
      useUserFolder: true,
      userId: body.userId,
    });

    for (const field in uploadedFiles) {
      uploadedFiles[field] = uploadedFiles[field].map((file) => ({
        ...file,
        fileName: `${body.userId}/${file.fileName}`,
      }));
    }

    for (const field in uploadedFiles) {
      for (const file of uploadedFiles[field]) {
        if (file.publicId) uploadedFilesPublicIds.push(file.publicId);
      }
    }

    for (const field of documentFields) {
      if (uploadedFiles[field][0]) {
        body[field] = {
          ...uploadedFiles[field][0],
          remark: body?.[field]?.remark,
        };
      }
    }

    if (uploadedFiles.panCard?.[0]) {
      body.panCard = {
        ...uploadedFiles.panCard[0],
        ...body?.panCard,
      };
    }

    if (uploadedFiles.otherDocuments.length && otherDocs) {
      body.otherDocuments = otherDocs.map((doc, index) => ({
        ...doc,
        ...uploadedFiles.otherDocuments[index],
      }));
    }

    body.createdBy = req.user._id;

    await USER_DOCUMENT.create(body);

    return successResponse(res, 200, "User documents added successfully");
  } catch (error) {
    await deleteMultipleFromCloudinary(uploadedFilesPublicIds);
    cleanupMultipleLocalFiles(req.files);

    next(error);
  }
};

exports.getAllUserDocuments = async (req, res, next) => {
  try {
    const { page, limit, userId } = req.query;

    const query = { isDeleted: false };

    if (userId) {
      query.userId = userId;
    }

    const { data, pagination } = await paginate({
      model: USER_DOCUMENT,
      query,
      populate: [
        {
          path: "userId",
          select: "name.firstName name.lastName",
        },
      ],
      page: Number(page),
      limit: Number(limit),
      sort: { createdAt: -1 },
    });

    const formattedData = data.map((item) => {
      const doc = item.toObject ? item.toObject() : { ...item };

      for (const field of documentFields) {
        if (doc?.[field]?.fileName) {
          doc[field] = {
            ...doc[field],
            url: getFileUrl(`userDocuments/${doc[field].fileName}`),
          };
        }
      }

      if (doc.otherDocuments?.length) {
        doc.otherDocuments = doc.otherDocuments.map((otherDoc) => ({
          ...otherDoc,
          url: otherDoc.fileName
            ? getFileUrl(`userDocuments/${otherDoc.fileName}`)
            : null,
        }));
      }

      return doc;
    });

    return successResponse(res, 200, "User documents fetched successfully", {
      data: formattedData,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserDocumentsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUserDocumentsExists = await USER_DOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!isUserDocumentsExists) {
      throw new AppError("User documents not found", 404);
    }

    for (const field of documentFields) {
      if (isUserDocumentsExists?.[field]?.fileName) {
        isUserDocumentsExists[field].url = getFileUrl(
          `userDocuments/${isUserDocumentsExists[field].fileName}`,
        );
      }
    }

    if (isUserDocumentsExists.otherDocuments?.length) {
      isUserDocumentsExists.otherDocuments =
        isUserDocumentsExists.otherDocuments.map((item) => ({
          ...item,
          url: item.fileName
            ? getFileUrl(`userDocuments/${item.fileName}`)
            : null,
        }));
    }

    return successResponse(
      res,
      200,
      "User documents fetched successfully",
      isUserDocumentsExists,
    );
  } catch (error) {
    next(error);
  }
};

exports.updateUserDocuments = async (req, res, next) => {
  const uploadedFilesPublicIds = [];
  const oldFilesPublicIdsToDelete = [];

  try {
    const { body: payload, params, files: multerFiles } = req;
    const { id } = params;

    const isUserDocumentsExists = await USER_DOCUMENT.findOne({
      userId: params.id,
      isDeleted: false,
    }).lean();

    if (!isUserDocumentsExists) {
      throw new AppError("User documents not found for given Id", 404);
    }

    let otherDocs = null;

    if (multerFiles?.otherDocuments?.length && payload.otherDocuments) {
      try {
        otherDocs =
          typeof payload.otherDocuments === "string"
            ? JSON.parse(payload.otherDocuments)
            : payload.otherDocuments;
      } catch {
        throw new AppError("Invalid otherDocuments JSON format", 400);
      }

      if (otherDocs.length !== multerFiles.otherDocuments.length) {
        throw new AppError(
          "otherDocuments metadata count must match uploaded files count",
          400,
        );
      }
    }

    const uploadedFiles = await uploadMultipleToCloudinary(multerFiles, {
      folder: "userDocuments",
      useUserFolder: true,
      userId: params.id,
    });

    for (const field in uploadedFiles) {
      uploadedFiles[field] = uploadedFiles[field].map((file) => ({
        ...file,
        fileName: `${params.id}/${file.fileName}`,
      }));
    }

    for (const field in uploadedFiles) {
      for (const file of uploadedFiles[field]) {
        if (file?.publicId) {
          uploadedFilesPublicIds.push(file.publicId);
        }
      }
    }

    for (const field of documentFields) {
      if (uploadedFiles?.[field]?.[0]) {
        if (isUserDocumentsExists?.[field]?.fileName) {
          oldFilesPublicIdsToDelete.push(
            `userDocuments/${isUserDocumentsExists[field].fileName}`,
          );
        }

        payload[field] = {
          ...uploadedFiles[field][0],
          remark:
            payload?.[field]?.remark || isUserDocumentsExists?.[field]?.remark,
        };
      }
    }

    if (uploadedFiles?.panCard?.[0]) {
      if (isUserDocumentsExists?.panCard?.fileName) {
        oldFilesPublicIdsToDelete.push(
          `userDocuments/${isUserDocumentsExists.panCard.fileName}`,
        );
      }

      payload.panCard = {
        ...uploadedFiles.panCard[0],
        remark:
          payload?.panCard?.remark || isUserDocumentsExists?.panCard?.remark,
        panNumber:
          payload?.panCard?.panNumber ||
          isUserDocumentsExists?.panCard?.panNumber,
      };
    }

    if (uploadedFiles?.otherDocuments?.length && otherDocs) {
      if (isUserDocumentsExists?.otherDocuments?.length) {
        for (const doc of isUserDocumentsExists.otherDocuments) {
          if (doc?.fileName) {
            oldFilesPublicIdsToDelete.push(`userDocuments/${doc.fileName}`);
          }
        }
      }

      payload.otherDocuments = otherDocs.map((doc, index) => ({
        ...doc,
        ...uploadedFiles.otherDocuments[index],
      }));
    }

    await USER_DOCUMENT.updateOne(
      { _id: isUserDocumentsExists._id, isDeleted: false },
      { $set: payload },
    );

    await deleteMultipleFromCloudinary(oldFilesPublicIdsToDelete);

    return successResponse(res, 200, "User documents updated successfully");
  } catch (error) {
    await deleteMultipleFromCloudinary(uploadedFilesPublicIds);

    cleanupMultipleLocalFiles(req.files);

    next(error);
  }
};

exports.deleteUserDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUserDocumentsExists = await USER_DOCUMENT.findOne({
      userId: id,
      isDeleted: false,
    });

    if (!isUserDocumentsExists) {
      throw new AppError("User documents not found for given Id", 404);
    }

    isUserDocumentsExists.isDeleted = true;
    isUserDocumentsExists.deletedAt = moment().toDate();

    await isUserDocumentsExists.save();

    await deleteFolderFromCloudinary(
      `userDocuments/${isUserDocumentsExists.userId}`,
    );

    return successResponse(res, 200, "User documents deleted successfully");
  } catch (error) {
    next(error);
  }
};

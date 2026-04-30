const moment = require("moment");
const cloudinary = require("../config/cloudinary");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USER_DOCUMENT } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { getFileUrl } = require("../utils/fileUrl");

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
  const uploadedPublicIds = [];

  try {
    const { body, files: multerFiles } = req;
    const files = req.uploadedFiles;

    for (const field in files) {
      for (const file of files[field]) {
        if (file?.path) {
          uploadedPublicIds.push(file.path);
        }
      }
    }

    for (const field of documentFields) {
      if (files?.[field]?.[0]) {
        body[field] = buildFileObject(
          files[field][0],
          multerFiles[field]?.[0],
          body?.[field]?.remark || "",
        );
      }
    }

    if (files?.panCard?.[0]) {
      body.panCard = {
        ...buildFileObject(
          files.panCard[0],
          multerFiles.panCard?.[0],
          body?.panCard?.remark || "",
        ),
        panNumber: body?.panCard?.panNumber || "",
      };
    }

    if (files?.otherDocuments?.length && body.otherDocuments) {
      let otherDocs;

      try {
        otherDocs =
          typeof body.otherDocuments === "string"
            ? JSON.parse(body.otherDocuments)
            : body.otherDocuments;
      } catch {
        throw new AppError("Invalid otherDocuments JSON format", 400);
      }

      if (otherDocs.length !== files.otherDocuments.length) {
        throw new AppError(
          "otherDocuments metadata count must match uploaded files count",
          400,
        );
      }

      body.otherDocuments = otherDocs.map((doc, index) => ({
        ...doc,
        ...buildFileObject(
          files.otherDocuments[index],
          multerFiles.otherDocuments?.[index],
          doc?.remark || "",
        ),
      }));
    }

    body.createdBy = req.user._id;

    await USER_DOCUMENT.create(body);

    return successResponse(res, 200, "User documents added successfully");
  } catch (error) {
    for (const publicId of uploadedPublicIds) {
      await cloudinary.uploader.destroy(publicId);
    }

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
  const uploadedPublicIds = [];

  try {
    const { body: payload, params, files: multerFiles } = req;
    const files = req.uploadedFiles;
    const { id } = params;

    const isUserDocumentsExists = await USER_DOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!isUserDocumentsExists) {
      throw new AppError("User documents not found for given Id", 404);
    }

    for (const field in files) {
      for (const file of files[field]) {
        if (file?.path) {
          uploadedPublicIds.push(file.path);
        }
      }
    }

    for (const field of documentFields) {
      if (files?.[field]?.[0]) {
        payload[field] = buildFileObject(
          files[field][0],
          multerFiles[field]?.[0],
          payload?.[field]?.remark ||
            isUserDocumentsExists?.[field]?.remark ||
            "",
        );
      }
    }

    if (files?.panCard?.[0]) {
      payload.panCard = {
        ...buildFileObject(
          files.panCard[0],
          multerFiles.panCard?.[0],
          payload?.panCard?.remark ||
            isUserDocumentsExists?.panCard?.remark ||
            "",
        ),
        panNumber:
          payload?.panCard?.panNumber ||
          isUserDocumentsExists?.panCard?.panNumber ||
          "",
      };
    }

    if (files?.otherDocuments?.length && payload.otherDocuments) {
      let otherDocs;

      try {
        otherDocs =
          typeof payload.otherDocuments === "string"
            ? JSON.parse(payload.otherDocuments)
            : payload.otherDocuments;
      } catch {
        throw new AppError("Invalid otherDocuments JSON format", 400);
      }

      if (otherDocs.length !== files.otherDocuments.length) {
        throw new AppError(
          "otherDocuments metadata count must match uploaded files count",
          400,
        );
      }

      payload.otherDocuments = otherDocs.map((doc, index) => ({
        ...doc,
        ...buildFileObject(
          files.otherDocuments[index],
          multerFiles.otherDocuments?.[index],
          doc?.remark || "",
        ),
      }));
    }

    await USER_DOCUMENT.updateOne(
      { _id: id, isDeleted: false },
      { $set: payload },
    );

    return successResponse(res, 200, "User documents updated successfully");
  } catch (error) {
    for (const publicId of uploadedPublicIds) {
      await cloudinary.uploader.destroy(publicId);
    }

    next(error);
  }
};

exports.deleteUserDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUserDocumentsExists = await USER_DOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isUserDocumentsExists) {
      throw new AppError("User documents not found for given Id", 404);
    }

    isUserDocumentsExists.isDeleted = true;
    isUserDocumentsExists.deletedAt = moment().toDate();

    await isUserDocumentsExists.save();

    return successResponse(res, 200, "User documents deleted successfully");
  } catch (error) {
    next(error);
  }
};

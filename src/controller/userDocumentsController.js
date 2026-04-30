const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERDOCUMENT } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { getFileUrl } = require("../utils/fileUrl");

const buildFileObject = (uploadedFile, originalFile = null, remark = "") => ({
  fileName: uploadedFile?.path?.replace(/^userDocuments\//, "") || null,
  fileType: originalFile?.mimetype || null,
  size: Math.round(originalFile.size / 1024),

  remark,
});

exports.addUserDocuments = async (req, res, next) => {
  try {
    const { body, files: multerFiles } = req;
    const files = req.uploadedFiles;

    const documentFields = [
      "offerLetter",
      "appointmentLetter",
      "tenthMarksheet",
      "twelfthOrDiplomaMarksheet",
      "bachelorsCertificate",
      "mastersDegreeMarksheet",
    ];

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

    await USERDOCUMENT.create(body);

    return successResponse(res, 200, "User documents added successfully");
  } catch (error) {
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
      model: USERDOCUMENT,
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

    const documentFields = [
      "offerLetter",
      "appointmentLetter",
      "tenthMarksheet",
      "twelfthOrDiplomaMarksheet",
      "bachelorsCertificate",
      "mastersDegreeMarksheet",
      "panCard",
    ];

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

    const doc = await USERDOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!doc) {
      throw new AppError("User documents not found", 404);
    }

    const documentFields = [
      "offerLetter",
      "appointmentLetter",
      "tenthMarksheet",
      "twelfthOrDiplomaMarksheet",
      "bachelorsCertificate",
      "mastersDegreeMarksheet",
      "panCard",
    ];

    for (const field of documentFields) {
      if (doc?.[field]?.fileName) {
        doc[field].url = getFileUrl(`userDocuments/${doc[field].fileName}`);
      }
    }

    if (doc.otherDocuments?.length) {
      doc.otherDocuments = doc.otherDocuments.map((item) => ({
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
      doc,
    );
  } catch (error) {
    next(error);
  }
};

exports.updateUserDocuments = async (req, res, next) => {
  try {
    const { body: payload, params, files: multerFiles } = req;
    const files = req.uploadedFiles;
    const { id } = params;

    const existingData = await USERDOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!existingData) {
      throw new AppError("User documents not found for given Id", 404);
    }

    const documentFields = [
      "offerLetter",
      "appointmentLetter",
      "tenthMarksheet",
      "twelfthOrDiplomaMarksheet",
      "bachelorsCertificate",
      "mastersDegreeMarksheet",
    ];

    for (const field of documentFields) {
      if (files?.[field]?.[0]) {
        payload[field] = buildFileObject(
          files[field][0],
          multerFiles[field]?.[0],
          payload?.[field]?.remark || existingData?.[field]?.remark || "",
        );
      }
    }

    if (files?.panCard?.[0]) {
      payload.panCard = {
        ...buildFileObject(
          files.panCard[0],
          multerFiles.panCard?.[0],
          payload?.panCard?.remark || existingData?.panCard?.remark || "",
        ),
        panNumber:
          payload?.panCard?.panNumber || existingData?.panCard?.panNumber || "",
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

    await USERDOCUMENT.updateOne(
      { _id: id, isDeleted: false },
      { $set: payload },
    );

    return successResponse(res, 200, "User documents updated successfully");
  } catch (error) {
    next(error);
  }
};

exports.deleteUserDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await USERDOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!data) {
      throw new AppError("User documents not found for given Id", 404);
    }

    data.isDeleted = true;
    data.deletedAt = moment().toDate();

    await data.save();

    return successResponse(res, 200, "User documents deleted successfully");
  } catch (error) {
    next(error);
  }
};

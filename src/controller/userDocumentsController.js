const moment = require("moment");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");
const { USERDOCUMENT } = require("../model/modelIndex");
const { getProjection } = require("../utils/projection");
const { AppError } = require("../utils/error");

exports.addUserDocuments = async (req, res, next) => {
  try {
    const { body, files } = req;

    const getFilePath = (file) => {
      return `/uploads/userDocuments/${body.userId}/${file.filename}`;
    };

    if (files) {
      if (files.offerLetter?.[0]) {
        body.offerLetter = {
          ...body.offerLetter,
          documentUrl: getFilePath(files.offerLetter[0]),
        };
      }

      if (files.appointmentLetter?.[0]) {
        body.appointmentLetter = {
          ...body.appointmentLetter,
          documentUrl: getFilePath(files.appointmentLetter[0]),
        };
      }

      if (files.tenthMarksheet?.[0]) {
        body.tenthMarksheet = {
          ...body.tenthMarksheet,
          documentUrl: getFilePath(files.tenthMarksheet[0]),
        };
      }

      if (files.twelfthOrDiplomaMarksheet?.[0]) {
        body.twelfthOrDiplomaMarksheet = {
          ...body.twelfthOrDiplomaMarksheet,
          documentUrl: getFilePath(files.twelfthOrDiplomaMarksheet[0]),
        };
      }

      if (files.bachelorsCertificate?.[0]) {
        body.bachelorsCertificate = {
          ...body.bachelorsCertificate,
          documentUrl: getFilePath(files.bachelorsCertificate[0]),
        };
      }

      if (files.mastersDegreeMarksheet?.[0]) {
        body.mastersDegreeMarksheet = {
          ...body.mastersDegreeMarksheet,
          documentUrl: getFilePath(files.mastersDegreeMarksheet[0]),
        };
      }

      if (files.panCard?.[0]) {
        body.panCard = {
          ...body.panCard,
          documentUrl: getFilePath(files.panCard[0]),
        };
      }

      if (files.otherDocuments && body.otherDocuments) {
        let otherDocs = [];

        if (typeof body.otherDocuments === "string") {
          otherDocs = JSON.parse(body.otherDocuments);
        } else {
          otherDocs = body.otherDocuments;
        }

        body.otherDocuments = otherDocs.map((doc, index) => {
          if (files.otherDocuments[index]) {
            return {
              ...doc,
              documentUrl: getFilePath(files.otherDocuments[index]),
            };
          }
          return doc;
        });
      }
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
    const { query } = req;
    const { page, limit, userId } = query;

    const _whereCondition = {
      isDeleted: false,
    };

    if (userId) {
      _whereCondition.userId = userId;
    }

    const { data, pagination } = await paginate({
      model: USERDOCUMENT,
      query: _whereCondition,
      populate: [{ path: "userId", select: "name.firstName name.lastName" }],
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
    });

    return successResponse(res, 200, "User documents fetched successfully", {
      data,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserDocumentsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await USERDOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!data) {
      throw new AppError("User documents not found", 404);
    }

    return successResponse(
      res,
      200,
      "User documents fetched successfully",
      data,
    );
  } catch (error) {
    next(error);
  }
};

exports.updateUserDocuments = async (req, res, next) => {
  try {
    const { body: payload, files, params } = req;
    const { id } = params;

    const existingData = await USERDOCUMENT.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingData) {
      throw new AppError("User documents not found for given Id", 404);
    }

    const getFilePath = (file) => {
      return `/uploads/userDocuments/${file.filename}`;
    };

    if (files) {
      if (files.offerLetter?.[0]) {
        payload.offerLetter = {
          ...existingData.offerLetter,
          ...payload.offerLetter,
          documentUrl: getFilePath(files.offerLetter[0]),
        };
      }

      if (files.panCard?.[0]) {
        payload.panCard = {
          ...existingData.panCard,
          ...payload.panCard,
          documentUrl: getFilePath(files.panCard[0]),
        };
      }

      if (files.otherDocuments && payload.otherDocuments) {
        let otherDocs = [];

        if (typeof payload.otherDocuments === "string") {
          otherDocs = JSON.parse(payload.otherDocuments);
        } else {
          otherDocs = payload.otherDocuments;
        }

        payload.otherDocuments = otherDocs.map((doc, index) => {
          if (files.otherDocuments[index]) {
            return {
              ...doc,
              documentUrl: getFilePath(files.otherDocuments[index]),
            };
          }
          return doc;
        });
      }
    }

    await USERDOCUMENT.updateOne(
      { _id: id, isDeleted: false },
      { $set: { ...payload } },
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
    data.deletedAt = new moment().toDate();

    await data.save();

    return successResponse(res, 200, "User documents deleted successfully");
  } catch (error) {
    next(error);
  }
};

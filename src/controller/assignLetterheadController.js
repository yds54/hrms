const moment = require("moment-timezone");
const {
  USER,
  LETTERHEADTYPE,
  ASSIGNLETTERHEAD,
} = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { successResponse } = require("../utils/sucess");
const { paginate } = require("../utils/pagination");
const { dateSearchQuery } = require("../utils/dateFormat");
const { TIMEZONES } = require("../utils/enum");
const {
  uploadToCloudinary,
  cleanupLocalFile,
  deleteFromCloudinary,
} = require("../utils/cloudinaryHelper");
const { getFileUrl } = require("../utils/fileUrl");

//================ CREATE ASSIGN LETTERHEAD =================
exports.createAssignLetterhead = async (req, res, next) => {
  let uploadedFilePublicId = null;
  try {
    const { _id: userId } = req.user;
    const { issueTo, letterheadType } = req.body;

    const isUserExists = await USER.findOne({
      _id: issueTo,
      isDeleted: false,
    }).select("_id");
    if (!isUserExists) {
      throw new AppError("Issue user not found with given Id", 404);
    }

    const isLetterheadTypeExists = await LETTERHEADTYPE.findOne({
      _id: letterheadType,
      isDeleted: false,
    }).select("_id");
    if (!isLetterheadTypeExists) {
      throw new AppError("Letterhead type not found with given Id", 404);
    }

    // Auto Increment Letterhead Number
    const last = await ASSIGNLETTERHEAD.findOne({
      letterheadNumber: { $exists: true },
    })
      .sort({ letterheadNumber: -1 })
      .select("letterheadNumber")
      .lean();
    let nextNumber = 1;
    if (last?.letterheadNumber) {
      nextNumber = last.letterheadNumber + 1;
    }

    const payload = {
      ...req.body,
      issuerName: userId,
      letterheadNumber: nextNumber,
    };

    if (req.file) {
      const uploadedFile = await uploadToCloudinary(req.file, {
        folder: "letterhead",
      });
      uploadedFilePublicId = uploadedFile.publicId;
      payload.uploadDocument = uploadedFile;
    }

    await ASSIGNLETTERHEAD.create(payload);
    return successResponse(res, 201, "Letterhead assigned", {
      letterheadNumber: nextNumber,
    });
  } catch (error) {
    await deleteFromCloudinary(uploadedFilePublicId);
    cleanupLocalFile(req.file?.path);
    next(error);
  }
};

//================ DISPLAY ASSIGN LETTERHEAD =================
exports.getAssignLetterhead = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;

    const pipeline = [
      {
        $match: { isDeleted: false },
      },
      {
        $lookup: {
          from: "users",
          localField: "issueTo",
          foreignField: "_id",
          as: "issueTo",
        },
      },
      { $unwind: { path: "$issueTo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "issuerName",
          foreignField: "_id",
          as: "issuerName",
        },
      },
      { $unwind: { path: "$issuerName", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "letterheadtypes",
          localField: "letterheadType",
          foreignField: "_id",
          as: "letterheadType",
        },
      },
      {
        $unwind: {
          path: "$letterheadType",
          preserveNullAndEmptyArrays: true,
        },
      },
      // ---------- SEARCH ----------
      ...(search
        ? (() => {
            const searchWords = search.trim().split(/\s+/);
            return [
              {
                $match: {
                  $and: searchWords.map((word) => ({
                    $or: [
                      { reason: { $regex: word, $options: "i" } },
                      { note: { $regex: word, $options: "i" } },
                      // issueTo name
                      {
                        "issueTo.name.firstName": {
                          $regex: word,
                          $options: "i",
                        },
                      },
                      {
                        "issueTo.name.middleName": {
                          $regex: word,
                          $options: "i",
                        },
                      },
                      {
                        "issueTo.name.lastName": {
                          $regex: word,
                          $options: "i",
                        },
                      },
                      // issuerName
                      {
                        "issuerName.name.firstName": {
                          $regex: word,
                          $options: "i",
                        },
                      },
                      {
                        "issuerName.name.middleName": {
                          $regex: word,
                          $options: "i",
                        },
                      },
                      {
                        "issuerName.name.lastName": {
                          $regex: word,
                          $options: "i",
                        },
                      },
                      // --- letterhead type
                      {
                        "letterheadType.type": { $regex: word, $options: "i" },
                      },
                      // number search
                      ...(isNaN(word)
                        ? []
                        : [{ letterheadNumber: Number(word) }]),
                    ],
                  })),
                },
              },
              // DATE SEARCH
              ...(dateSearchQuery("issueDate", search)
                ? [{ $match: dateSearchQuery("issueDate", search) }]
                : []),
            ];
          })()
        : []),
      {
        $project: {
          letterheadNumber: 1,
          issueDate: 1,
          reason: 1,
          note: 1,
          uploadDocument: 1,
          createdAt: 1,
          issueTo: {
            _id: "$issueTo._id",
            name: "$issueTo.name",
          },
          issuerName: {
            _id: "$issuerName._id",
            name: "$issuerName.name",
          },
          letterheadType: {
            _id: "$letterheadType._id",
            type: "$letterheadType.type",
          },
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: ASSIGNLETTERHEAD,
      page,
      limit,
      pipeline,
      sort: { createdAt: -1 },
    });

    const formattedData = data.map((item) => {
      const obj = item;
      if (obj.uploadDocument?.fileName) {
        obj.uploadDocument.url = getFileUrl(
          `letterhead/${obj.uploadDocument.fileName}`,
        );
      }
      return obj;
    });

    return successResponse(res, 200, "Assigned letterheads fetched", {
      data: formattedData,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

//================ UPDATE ASSIGN LETTERHEAD =================
exports.updateAssignLetterhead = async (req, res, next) => {
  let uploadedFilePublicId = null;
  try {
    const { id } = req.params;
    const { issueTo, letterheadType } = req.body;

    // check record exists for update
    const isAssignLetterheadExists = await ASSIGNLETTERHEAD.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id");
    if (!isAssignLetterheadExists) {
      throw new AppError("Letterhead not found with given Id", 404);
    }

    // if update - issueTo check user exists
    if (issueTo) {
      const isUserExists = await USER.findOne({
        _id: issueTo,
        isDeleted: false,
      }).select("_id");
      if (!isUserExists) {
        throw new AppError("Issue user not found with given Id", 404);
      }
    }

    // if update - letterhead type check exists
    if (letterheadType) {
      const isLetterheadTypeExists = await LETTERHEADTYPE.findOne({
        _id: letterheadType,
        isDeleted: false,
      }).select("_id");
      if (!isLetterheadTypeExists) {
        throw new AppError("Letterhead type not found with given Id", 404);
      }
    }

    const payload = { ...req.body };
    if (req.file) {
      const uploadedFile = await uploadToCloudinary(req.file, {
        folder: "letterhead",
      });
      uploadedFilePublicId = uploadedFile.publicId;
      payload.uploadDocument = uploadedFile;
    }
    await ASSIGNLETTERHEAD.updateOne(
      { _id: id, isDeleted: false },
      { $set: payload },
    );

    // DELETE OLD FILE
    if (uploadedFilePublicId && existing.uploadDocument?.fileName) {
      await deleteFromCloudinary(
        `letterhead/${existing.uploadDocument.fileName}`,
      );
    }
    return successResponse(res, 200, "Letterhead updated");
  } catch (error) {
    await deleteFromCloudinary(uploadedFilePublicId);
    cleanupLocalFile(req.file?.path);
    next(error);
  }
};

//================ DELETE ASSIGN LETTERHEAD =================
exports.deleteAssignLetterhead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAssignLetterheadExists = await ASSIGNLETTERHEAD.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id uploadDocument");
    if (!isAssignLetterheadExists) {
      throw new AppError("Letterhead not found with given Id", 404);
    }

    // DELETE FILE
    if (isAssignLetterheadExists.uploadDocument?.fileName) {
      await deleteFromCloudinary(
        `letterhead/${isAssignLetterheadExists.uploadDocument.fileName}`,
      );
    }

    await ASSIGNLETTERHEAD.updateOne(
      { _id: id },
      {
        $set: {
          isDeleted: true,
          deletedAt: moment().tz(TIMEZONES.INDIA).toDate(),
        },
      },
    );

    return successResponse(res, 200, "Letterhead deleted successfully");
  } catch (error) {
    next(error);
  }
};

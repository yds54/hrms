const moment = require("moment");
const { INTERVIEW } = require("../model/modelIndex");
const { AppError } = require("../utils/error");
const { paginate } = require("../utils/pagination");
const { searchConditions } = require("../utils/searchHelper");
const { ROLES } = require("../utils/enum");
const { successResponse } = require("../utils/sucess");
const {
  uploadToCloudinary,
  cleanupLocalFile,
  deleteFromCloudinary,
} = require("../utils/cloudinaryHelper");
const {
  getDayRange,
  getMonthRange,
  dateSearchQuery,
} = require("../utils/dateFormat");
const { getFileUrl } = require("../utils/fileUrl");

exports.addInterview = async (req, res, next) => {
  let uploadedFilePublicId = null;

  try {
    const { body, file, user } = req;

    const isInterviewCandidateExists = await INTERVIEW.findOne({
      email: body.email,
      contactNumber: body.contactNumber,
      isDeleted: false,
    }).select("email isDeleted contactNumber");

    if (isInterviewCandidateExists) {
      throw new AppError(
        "Candidate already exists with given email or contact number",
        409,
      );
    }
    body.createdBy = req.user._id;

    if (file) {
      const uploadedFile = await uploadToCloudinary(file, {
        folder: "interviewResume",
      });

      uploadedFilePublicId = uploadedFile.publicId;
      body.resume = uploadedFile;
    }
    await INTERVIEW.create(body);

    return successResponse(res, 200, "Interview added successfully");
  } catch (error) {
    await deleteFromCloudinary(uploadedFilePublicId);
    cleanupLocalFile(req.file?.path);
    next(error);
  }
};

exports.getAllInterviews = async (req, res, next) => {
  try {
    const { user, query } = req;
    const { page, limit, interviewStatus, search, month, year } = query;
    const selectedMonth = month ? Number(month) : null;
    const selectedYear = year ? Number(year) : null;

    const _whereCondition = {
      isDeleted: false,
    };

    if (user.role !== ROLES.ADMIN) {
      _whereCondition.$or = [
        { technicalRoundUser: user._id },
        { hrRoundUser: user._id },
      ];
    }

    if (interviewStatus !== undefined) {
      _whereCondition.interviewStatus = interviewStatus === "true";
    }

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "technicalRoundUser",
          foreignField: "_id",
          as: "technicalRoundUser",
        },
      },
      {
        $unwind: {
          path: "$technicalRoundUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "hrRoundUser",
          foreignField: "_id",
          as: "hrRoundUser",
        },
      },
      {
        $unwind: {
          path: "$hrRoundUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          interviewMonth: { $month: "$interviewTime" },
          interviewYear: { $year: "$interviewTime" },
        },
      },

      {
        $match: {
          ...(selectedMonth && {
            interviewMonth: selectedMonth,
          }),

          ...(selectedYear && {
            interviewYear: selectedYear,
          }),
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                  { contactNumber: { $regex: search, $options: "i" } },
                  { technology: { $regex: search, $options: "i" } },

                  searchConditions(search, "technicalRoundUser.fullName"),
                  searchConditions(search, "hrRoundUser.fullName"),
                ],
              },
            },
          ]
        : []),
      {
        $project: {
          name: 1,
          qualification: 1,
          technology: 1,
          email: 1,
          interviewMode: 1,
          interviewTime: 1,
          callDate: 1,
          interviewStatus: 1,
          practicalTestStatus: 1,
          resume: 1,
          technicalRoundUser: {
            _id: "$technicalRoundUser._id",
            name: {
              firstName: "$technicalRoundUser.name.firstName",
              middleName: "$technicalRoundUser.name.middleName",
              lastName: "$technicalRoundUser.name.lastName",
            },
          },
          hrRoundUser: {
            _id: "$hrRoundUser._id",
            name: {
              firstName: "$hrRoundUser.name.firstName",
              middleName: "$hrRoundUser.name.middleName",
              lastName: "$hrRoundUser.name.lastName",
            },
          },
        },
      },
    ];

    const { data, pagination } = await paginate({
      model: INTERVIEW,
      query: _whereCondition,
      page: +page,
      limit: +limit,
      sort: { createdAt: -1 },
      pipeline,
    });

    const formattedData = data.map((interviewObj) => ({
      ...interviewObj,

      resume: {
        url: interviewObj.resume?.fileName
          ? getFileUrl(`interviewResume/${interviewObj.resume.fileName}`)
          : null,
      },
    }));

    return successResponse(res, 200, "Interviews fetched successfully", {
      data: formattedData,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInterviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isInterviewExists = await INTERVIEW.findOne({
      _id: id,
      isDeleted: false,
    }).populate([
      {
        path: "technicalRoundUser",
        select: "name.firstName name.lastName",
      },
      {
        path: "hrRoundUser",
        select: "name.firstName name.lastName",
      },
    ]);

    if (!isInterviewExists) {
      throw new AppError("Interview not found for given ID", 404);
    }

    const data = isInterviewExists.toObject();

    if (data.resume?.fileName) {
      data.resume.url = getFileUrl(`interviewResume/${data.resume.fileName}`);
    }

    return successResponse(res, 200, "Interview fetched successfully", {
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInterview = async (req, res, next) => {
  let uploadedFilePublicId = null;

  try {
    const { params, body: payload, file } = req;

    const { id } = params;

    const existingInterview = await INTERVIEW.findOne({
      _id: id,
      isDeleted: false,
    }).select("_id resume");

    if (!existingInterview) {
      throw new AppError("Interview not found for given ID", 404);
    }

    if (file) {
      const uploadedFile = await uploadToCloudinary(file, {
        folder: "interviewResume",
      });

      uploadedFilePublicId = uploadedFile.publicId;

      payload.resume = uploadedFile;
    }

    await INTERVIEW.updateOne(
      { _id: id, isDeleted: false },
      {
        $set: payload,
      },
    );
    if (uploadedFilePublicId && existingInterview.resume?.fileName) {
      await deleteFromCloudinary(
        `interviewResume/${existingInterview.resume.fileName}`,
      );
    }
    return successResponse(res, 200, "Interview updated successfully");
  } catch (error) {
    await deleteFromCloudinary(uploadedFilePublicId);
    cleanupLocalFile(req.file?.path);
    next(error);
  }
};

exports.deleteInterview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isInterviewExists = await INTERVIEW.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!isInterviewExists) {
      throw new AppError("Interview not found for given ID", 404);
    }

    if (isInterviewExists.resume?.fileName) {
      await deleteFromCloudinary(
        `interviewResume/${isInterviewExists.resume.fileName}`,
      );
    }
    isInterviewExists.isDeleted = true;
    isInterviewExists.deletedAt = moment().toDate();
    await isInterviewExists.save();
    return successResponse(res, 200, "Interview deleted successfully");
  } catch (error) {
    next(error);
  }
};

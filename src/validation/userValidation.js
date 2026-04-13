const { Joi } = require("express-validation");
const { GENDER, MARITAL_STATUS, ROLES, USER_STATUS } = require("../utils/enum");

exports.getuserValidation = {
  query: Joi.object({
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    designation: Joi.string(),
    organizationType: Joi.string(),
    mobileNo: Joi.string().pattern(/^[0-9]{10}$/),
    id: Joi.string().hex(),
    gender: Joi.string().valid(...Object.values(GENDER)),
    attendanceType: Joi.string(),
    Left: Joi.boolean(),
  }),
};

exports.updateUserValidation = {
  body: Joi.object({
    profilePicture: Joi.string(),
    name: Joi.object({
      firstName: Joi.string().trim(),
      middleName: Joi.string().trim().allow("", null),
      lastName: Joi.string().trim(),
    }),
    email: Joi.string().email(),

    nameAsPerAadhaar: Joi.string(),
    aadhaarNumber: Joi.string().length(12),

    birthDate: Joi.date(),

    gender: Joi.string().valid(...Object.values(GENDER)),

    contactNumber: Joi.string().pattern(/^[6-9]\d{9}$/),
    emergencyContactNumber: Joi.string().pattern(/^[6-9]\d{9}$/),

    correspondenceAddress: Joi.string(),
    permanentAddress: Joi.string(),

    maritalStatus: Joi.string().valid(...Object.values(MARITAL_STATUS)),

    marriageDate: Joi.date(),

    rentalAllowance: Joi.boolean(),
    rentalAllowanceAmount: Joi.number(),

    leavecreaditType: Joi.string(),

    designationId: Joi.string(),
    position: Joi.string(),
    departmentId: Joi.string(),

    vehicleNumber: Joi.string(),

    education: Joi.object({
      degree: Joi.string(),
      collegeName: Joi.string(),
      yearOfPassing: Joi.number(),
    }),

    bankDetails: Joi.object({
      bankId: Joi.string(),
      accountNumber: Joi.string(),
      ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/),
      accountHolderName: Joi.string(),
    }),

    resignationDetails: Joi.object({
      resignationDate: Joi.date(),
      NoticePeriod: Joi.number(),
      LastDate: Joi.date(),
    }),

    officeTiming: Joi.object({
      entryTime: Joi.string().pattern(
        /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i,
      ),
      exitTime: Joi.string().pattern(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i),
      totalMinutes: Joi.number(),
      lateEntryAfterMinutes: Joi.string().pattern(
        /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i,
      ),
      overtimeAfterMinutes: Joi.number(),
    }),

    attendanceType: Joi.string(),

    considerOvertime: Joi.boolean(),

    organizationId: Joi.string(),

    role: Joi.string().valid(...Object.values(ROLES)),

    drsRequired: Joi.boolean(),

    sendSalarySlipEmail: Joi.boolean(),

    status: Joi.string().valid(...Object.values(USER_STATUS)),

    isLeft: Joi.boolean(),

    isDeleted: Joi.boolean(),
    isUpdated: Joi.boolean(),
  }).unknown(false),
};

exports.userdeleteValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
};

exports.getUserByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

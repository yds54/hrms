const { Joi } = require("express-validation");
const { GENDER, MARITAL_STATUS, ROLES, USER_STATUS } = require("../utils/enum");

exports.UserValidation = {
  body: Joi.object({
    profilePicture: Joi.string(),

    name: Joi.object({
      firstName: Joi.string().trim().min(2).max(30).required(),
      middleName: Joi.string().trim().min(2).max(30).allow("", null),
      lastName: Joi.string().trim().min(2).max(30).required(),
    }).required(),

    marriageDate: Joi.date(),

    rentalAllowance: Joi.boolean(),

    rentalAllowanceAmount: Joi.number(),

    leavecreaditType: Joi.string(),

    email: Joi.string().email().lowercase().required(),

    password: Joi.string()
      .min(6)
      .max(12)
      .pattern(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/\\|`~]).+$/,
      )
      .required(),

    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
      }),

    nameAsPerAadhaar: Joi.string().trim().min(3).max(50).allow("", null),

    aadhaarNumber: Joi.string()
      .pattern(/^[0-9]{12}$/)
      .allow("", null),

    birthDate: Joi.date().less("now").required(),

    gender: Joi.string()
      .valid(...Object.values(GENDER))
      .required(),

    contactNumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),

    emergencyContactNumber: Joi.string().pattern(/^[0-9]{10}$/),
    correspondenceAddress: Joi.string().max(255).allow("", null),

    permanentAddress: Joi.string().max(255).required(),

    maritalStatus: Joi.string()
      .valid(...Object.values(MARITAL_STATUS))
      .default(MARITAL_STATUS.SINGLE),

    designationId: Joi.string().hex().length(24).required(),

    position: Joi.string().max(50).required(),

    departmentId: Joi.string().hex().length(24).required(),

    vehicleNumber: Joi.string()
      .pattern(/^[A-Z0-9-]{6,15}$/i)
      .allow("", null),

    education: Joi.object({
      degree: Joi.string().max(50).allow("", null),
      collegeName: Joi.string().max(100).allow("", null),
      yearOfPassing: Joi.number()
        .min(1950)
        .max(new Date().getFullYear())
        .allow(null),
    }),

    bankDetails: Joi.object({
      bankId: Joi.string().hex().length(24),

      accountNumber: Joi.string()
        .pattern(/^[0-9]{9,18}$/)
        .allow("", null),

      ifscCode: Joi.string()
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
        .allow("", null),

      accountHolderName: Joi.string().max(100).allow("", null),
    }),

    officeTiming: Joi.object({
      entryTime: Joi.string().allow("", null),
      exitTime: Joi.string().allow("", null),
      totalMinutes: Joi.number().min(0).allow(null),
      lateEntryAfterMinutes: Joi.number().min(0).allow(null),
      overtimeAfterMinutes: Joi.number().min(0).allow(null),
    }),

    attendanceType: Joi.string().max(50).required(),

    considerOvertime: Joi.boolean().default(false),

    organizationId: Joi.string().hex().length(24),

    role: Joi.string()
      .valid(...Object.values(ROLES))
      .default(ROLES.USER),

    drsRequired: Joi.boolean().default(true),

    sendSalarySlipEmail: Joi.boolean().default(true),

    joiningInfo: Joi.object({
      trainingStartDate: Joi.date().allow(null),
      trainingDurationMonths: Joi.number().min(0).allow(null),
      trainingEndDate: Joi.date().allow(null),
      joiningDate: Joi.date().allow(null),
      bondDurationMonths: Joi.number().min(0).allow(null),
      bondCompletedDate: Joi.date().allow(null),
    }),

    status: Joi.string()
      .valid(...Object.values(USER_STATUS))
      .default(USER_STATUS.ACTIVE),

    isDeleted: Joi.boolean().default(false),
  }),
};

exports.loginValidation = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(6)
      .max(12)
      .pattern(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/\\|`~]).+$/,
      ),
  }),
};

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
      entryTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
      exitTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
      totalMinutes: Joi.number(),
      lateEntryAfterMinutes: Joi.number(),
      overtimeAfterMinutes: Joi.number(),
    }),

    attendanceType: Joi.string(),

    considerOvertime: Joi.boolean(),

    organizationId: Joi.string(),

    role: Joi.string().valid(...Object.values(ROLES)),

    drsRequired: Joi.boolean(),

    sendSalarySlipEmail: Joi.boolean(),

    joiningInfo: Joi.object({
      trainingStartDate: Joi.date(),
      trainingDurationMonths: Joi.number(),
      trainingEndDate: Joi.date(),
      joiningDate: Joi.date(),
      bondDurationMonths: Joi.number(),
      bondCompletedDate: Joi.date(),
    }),

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

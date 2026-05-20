const { Joi } = require("express-validation");
const { GENDER, MARITAL_STATUS, ROLES, USER_STATUS } = require("../utils/enum");

exports.userRegisterValidation = {
  body: Joi.object({
    profilePicture: Joi.object({
      fileName: Joi.string().allow(null),
      fileType: Joi.string().allow(null),
      size: Joi.number().allow(null),
    }).optional(),
    name: Joi.object({
      firstName: Joi.string().trim().min(2).max(30).required(),
      middleName: Joi.string().trim().min(2).max(30).allow("", null),
      lastName: Joi.string().trim().min(2).max(30).required(),
    }).required(),

    marriageDate: Joi.date(),
    rentalAllowance: Joi.boolean(),
    rentalAllowanceAmount: Joi.number(),
    leavecreaditType: Joi.string(),
    leaveTotalMinutes: Joi.number(),
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
      .allow("", null)
      .optional(),

    education: Joi.object({
      degree: Joi.string().max(50).allow("", null),
      collegeName: Joi.string().max(100).allow("", null),
      yearOfPassing: Joi.number()
        .min(1950)
        .max(new Date().getFullYear())
        .allow(null),
    }),

    bankDetails: Joi.object({
      bankId: Joi.string().hex().length(24).required(),
      accountNumber: Joi.string()
        .pattern(/^[0-9]{9,18}$/)
        .allow("", null),
      ifscCode: Joi.string()
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
        .allow("", null),
      accountHolderName: Joi.string().max(100).allow("", null),
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

    attendanceType: Joi.string().max(50).required(),
    considerOvertime: Joi.boolean().default(false),
    organizationId: Joi.string().hex().length(24).required(),
    role: Joi.string()
      .valid(...Object.values(ROLES))
      .default(ROLES.USER),
    drsRequired: Joi.boolean().default(true),
    sendSalarySlipEmail: Joi.boolean().default(true),
    status: Joi.string()
      .valid(...Object.values(USER_STATUS))
      .default(USER_STATUS.ACTIVE),
    isDeleted: Joi.boolean().default(false),
  }),
};

//============== LOGIN USER VALIDATION ================
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

//================ FORGOT PASSWORD VALIDATION ===================
exports.forgotPasswordValidation = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

//============= CHANGE PASSWORD VALIDATION ==============
exports.changePasswordValidation = {
  body: Joi.object({
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({ "any.only": "Passwords do not match" }),
    token: Joi.string().optional(),
  }),
};

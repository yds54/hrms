const { Joi } = require("express-validation");
const {
  GENDER,
  MARITAL_STATUS,
  ROLES,
  USER_STATUS,
  LEFT_TYPE,
} = require("../utils/enum");

//================= DISPLAY USERS VALIDATION ======================
exports.getuserValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    designation: Joi.string(),
    department: Joi.string(),
    organizationId: Joi.string(),
    mobileNo: Joi.string().pattern(/^[0-9]{10}$/),
    id: Joi.string().hex(),
    gender: Joi.string().valid(...Object.values(GENDER)),
    attendanceType: Joi.string(),
    Left: Joi.boolean(),
    search: Joi.string(),
    role: Joi.string(),
  }),
};

//=================== DELETE USER VALIDATION ==================
exports.userdeleteValidation = {
  params: Joi.object({
    id: Joi.string().length(24).hex().required(),
  }),
};

//=============== UPDATE USER PROFILE VALIDATION ===================
exports.updateUserValidation = {
  body: Joi.object({
    profilePicture: Joi.object({
      fileName: Joi.string().allow(null),
      fileType: Joi.string().allow(null),
      size: Joi.number().allow(null),
      url: Joi.string().allow(null),
    }).optional(),
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
    contactNumber: Joi.string().pattern(/^[0-9]{10}$/),
    emergencyContactNumber: Joi.string().pattern(/^[0-9]{10}$/),
    correspondenceAddress: Joi.string(),
    permanentAddress: Joi.string(),
    maritalStatus: Joi.string().valid(...Object.values(MARITAL_STATUS)),
    marriageDate: Joi.date(),
    rentalAllowance: Joi.boolean(),
    rentalAllowanceAmount: Joi.number(),
    leaveCreditType: Joi.string(),
    leaveTotalMinutes: Joi.number(),
    designationId: Joi.string().hex().length(24),
    position: Joi.string(),
    departmentId: Joi.string().hex().length(24),
    vehicleNumber: Joi.string().allow("", null),

    education: Joi.object({
      degree: Joi.string(),
      collegeName: Joi.string(),
      yearOfPassing: Joi.number(),
    }),

    bankDetails: Joi.object({
      bankId: Joi.string().hex().length(24).required(),
      accountNumber: Joi.string(),
      ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/),
      accountHolderName: Joi.string(),
    }),

    resignationDetails: Joi.object({
      resignationDate: Joi.date().allow(null),
      NoticePeriod: Joi.number().allow(null),
      LastDate: Joi.date().allow(null),
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

//================= DISPLAY USER BY ID VALIDATION ========================
exports.getUserByIdValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

exports.gstAllUsersByOrganizationValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).required(),
    limit: Joi.number().integer().min(1).required(),
    search: Joi.string(),
  }),
};

exports.getRandomUsersValidation = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).required(),
    page: Joi.number().integer().min(1).required(),
  }),
};

exports.markEmployeeAsLeftValidation = {
  body: Joi.object({
    resignationDetails: Joi.object({
      leftType: Joi.string()
        .valid(...Object.values(LEFT_TYPE))
        .required(),
      reason: Joi.string().trim().required(),
      resignationDate: Joi.date().required(),
      noticePeriod: Joi.number().min(0),
      lastWorkingDate: Joi.date(),
      offboardingCriteria: Joi.array().items(
        Joi.object({
          id: Joi.string().hex().length(24).required(),
          criteria: Joi.string().trim().required(),
          isChecked: Joi.boolean().required(),
          notes: Joi.string().allow("", null).trim(),
        }),
      ),
    }),
  }),
};

exports.rejoinEmployeeValidation = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

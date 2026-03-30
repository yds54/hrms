const mongoose = require("mongoose");
const { GENDER, MARITAL_STATUS, ROLES, USER_STATUS } = require("../utils/enum");

const userSchema = new mongoose.Schema(
  {
    profilePicture: String,

    name: {
      firstName: String,
      middleName: String,
      lastName: String,
    },

    email: {
      type: String,
      unique: true,
    },

    password: {
      type: String,
      select: false,
    },

    employeeCode: {
      type: String,
      unique: true,
    },

    nameAsPerAadhaar: String,
    aadhaarNumber: String,

    birthDate: Date,

    gender: {
      type: String,
      enum: Object.values(GENDER),
    },

    contactNumber: String,
    emergencyContactNumber: String,

    correspondenceAddress: String,
    permanentAddress: String,

    maritalStatus: {
      type: String,
      enum: Object.values(MARITAL_STATUS),
      default: MARITAL_STATUS.SINGLE,
    },

    designation: String,
    position: String,
    departmentName: String,

    vehicleNumber: String,

    education: {
      degree: String,
      collegeName: String,
      yearOfPassing: Number,
    },

    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
    },

    officeTiming: {
      entryTime: String,
      exitTime: String,
      totalMinutes: Number,
      lateEntryAfterMinutes: Number,
      overtimeAfterMinutes: Number,
    },

    attendanceType: String,

    considerOvertime: {
      type: Boolean,
      default: false,
    },

    organizationType: String,

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },

    drsRequired: {
      type: Boolean,
      default: true,
    },

    sendSalarySlipEmail: {
      type: Boolean,
      default: true,
    },

    rentalAllowance:Boolean,

    rentalAllowanceAmount:Number,

    leavecreaditType:String,

    resignationDetails :{
      resignationDate:Date,
      NoticePeriod:Number,
      LastDate:Date
    },

    joiningInfo: {
      trainingStartDate: Date,
      trainingDurationMonths: Number,
      trainingEndDate: Date,
      joiningDate: Date,
      bondDurationMonths: Number,
      bondCompletedDate: Date,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
     
    // isUpdated: {
    //   type: Boolean,
    //   default: false,
    // },

    isLeft:{type:Boolean,default:false},

    marriageDate:Date,

    deletedBy:String,

    updatedBy:String

  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("user", userSchema);

const mongoose = require("mongoose");
const { GENDER, MARITAL_STATUS, ROLES, USER_STATUS } = require("../utils/enum");

const userSchema = new mongoose.Schema(
  {
    profilePicture: { type: String },

    name: {
      firstName: { type: String },
      middleName: { type: String },
      lastName: { type: String },
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
    nameAsPerAadhaar: { type: String },
    aadhaarNumber: { type: String },
    birthDate: { type: Date },
    gender: {
      type: String,
      enum: Object.values(GENDER),
    },
    contactNumber: { type: String },
    emergencyContactNumber: { type: String },
    correspondenceAddress: { type: String },
    permanentAddress: { type: String },
    maritalStatus: {
      type: String,
      enum: Object.values(MARITAL_STATUS),
      default: MARITAL_STATUS.SINGLE,
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "designation",
      required: true,
    },
    position: { type: String },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
    },
    vehicleNumber: { type: String },
    education: {
      degree: { type: String },
      collegeName: { type: String },
      yearOfPassing: { type: Number },
    },
    bankDetails: {
      bankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bank",
        required: true,
      },
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String },
    },
    officeTiming: {
      entryTime: { type: String },
      exitTime: { type: String },
      totalMinutes: { type: Number },
      lateEntryAfterMinutes: { type: String },
      overtimeAfterMinutes: { type: Number },
    },
    attendanceType: { type: String },
    considerOvertime: {
      type: Boolean,
      default: false,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      required: true,
    },
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
    rentalAllowance: { type: Boolean },
    rentalAllowanceAmount: { type: Number },
    leavecreaditType: { type: String },
    resignationDetails: {
      resignationDate: { type: Date },
      NoticePeriod: { type: Number },
      LastDate: { type: Date },
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
    isLeft: { type: Boolean, default: false },
    marriageDate: { type: Date },
    deletedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  },
);

userSchema.virtual("fullName").get(function () {
  return [this.name?.firstName, this.name?.middleName, this.name?.lastName]
    .filter(Boolean)
    .join(" ");
});

module.exports = mongoose.model("user", userSchema);

const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    previousCompanyName: {
      type: String,
      trim: true,
      default: null,
    },
    qualification: {
      type: String,
      trim: true,
      default: null,
    },
    technology: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: null,
    },
    interviewMode: {
      type: String,
      enum: ["Online", "Offline"],
      default: null,
    },
    yearOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    currentSalary: {
      type: Number,
      min: 0,
      default: 0,
    },
    expectedSalary: {
      type: Number,
      min: 0,
      default: 0,
    },
    interviewTime: {
      type: Date,
      required: true,
      index: true,
    },
    callDate: {
      type: Date,
      default: Date.now,
    },
    technicalRoundUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    hrRoundUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    referenceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    interviewStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    practicalTestStatus: {
      type: Boolean,
      default: false,
    },
    communicationSkill: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    confidenceOrBodyLang: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    logicalSkills: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    dataStructure: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    objectOriented: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    sql: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    adaptionPower: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
    resume: {
      fileName: {
        type: String,
        default: null,
      },
      fileType: {
        type: String,
        default: null,
      },
      size: {
        type: Number,
        default: null,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("interview", interviewSchema);

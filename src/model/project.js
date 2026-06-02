const mongoose = require("mongoose");
const { PROJECT_STATUS } = require("../utils/enum");

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    techStackId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "techStack",
      },
    ],
    description: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("project", projectSchema);

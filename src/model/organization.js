const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    headHR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    organizationAddress: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
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
    organizationAccountNumber: {
      type: String,
      trim: true,
    },
    irregularEmployeeCriteria: {
      days: {
        type: Number,
        default: 10,
      },
      beforePercentage: {
        type: Number,
        default: 3,
      },
      afterPercentage: {
        type: Number,
        default: 5,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("organization", organizationSchema);

const mongoose = require("mongoose");

const monthlyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    workingDays: {
      type: Number,
      required: true,
    },
    workingHours: {
      type: Number,
      required: true,
    },
    monthlyReport: [
      {
        factor: {
          type: String,
          required: true,
        },
        target: {
          type: Number,
          required: true,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    deletedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

monthlyReportSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("drsMonthlyReport", monthlyReportSchema);

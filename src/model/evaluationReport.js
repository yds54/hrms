const mongoose = require("mongoose");

const evaluationReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    criteria: [
      {
        _id: false,
        criteriaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "evaluationCriteria",
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
      },
    ],
    weeklyAverage: {
      type: Number,
      default: 0,
    },
    publicNote: {
      type: String,
      default: null,
    },
    privateNote: {
      type: String,
      default: null,
    },
    evaluatedBy: {
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
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("evaluationReport", evaluationReportSchema);

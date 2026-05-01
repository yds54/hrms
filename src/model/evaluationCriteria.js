const mongoose = require("mongoose");

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    criteria: {
      type: String,
      required: true,
      trim: true,
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

evaluationCriteriaSchema.index({ criteria: 1 }, { unique: true });

module.exports = mongoose.model("evaluationCriteria", evaluationCriteriaSchema);

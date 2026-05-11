const mongoose = require("mongoose");

const drsFactorSchema = new mongoose.Schema(
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

drsFactorSchema.index({ criteria: 1 }, { unique: true });

module.exports = mongoose.model("drsFactor", drsFactorSchema);

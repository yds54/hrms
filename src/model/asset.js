const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "assetCategory",
      required: true,
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
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

module.exports = mongoose.model("asset", assetSchema);

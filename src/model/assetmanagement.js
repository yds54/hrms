const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "assetCategory",
      required: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "asset",
      required: true,
    },
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    issueDate: Date,

    remark: String,

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("assetmanagement", assetSchema);

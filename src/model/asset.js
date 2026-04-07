const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "assetCategory",
      required: true,
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    issueDate: {
      ttype: Date,
    },
    remark: {
      type: String,
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

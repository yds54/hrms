const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetCategoryId: {
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
    issueDate: { type: Date },
    remark: { type: String },
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
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

assetSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.assetCategory = ret.assetCategoryId;
    ret.asset = ret.assetId;
    delete ret.assetCategoryId;
    delete ret.assetId;
    return ret;
  },
});
module.exports = mongoose.model("assetmanagement", assetSchema);

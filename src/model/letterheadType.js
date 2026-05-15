const mongoose = require("mongoose");

const letterheadTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("letterheadType", letterheadTypeSchema);

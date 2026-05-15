const mongoose = require("mongoose");

const assignLetterheadSchema = new mongoose.Schema(
  {
    letterheadNumber: {
      type: Number,
      unique: true,
    },
    issuerName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    issueTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    letterheadType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "letterheadType",
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    uploadDocument: {
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
    note: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("assignLetterhead", assignLetterheadSchema);

const mongoose = require("mongoose");

const ticketCommentSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ticket",
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    attachFile: [
      {
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
    ],
    createdBy: {
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
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ticketComment", ticketCommentSchema);

const mongoose = require("mongoose");
const { PRIORITY_STATUS, TICKET_STATUS } = require("../utils/enum");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITY_STATUS),
      default: PRIORITY_STATUS.NORMAL,
    },
    content: {
      type: String,
      required: true,
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
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.TODO,
    },
    isArchived: {
      type: Boolean,
      default: false,
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

ticketSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model("ticket", ticketSchema);

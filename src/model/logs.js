const mongoose = require("mongoose");

const logsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    tableName: {
      type: String,
      required: true,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
    },
    oldRecord: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newRecord: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    changedFields: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("logs", logsSchema);

const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    holidayDate: {
      type: Date,
      required: true,
    },
    holidayReason: {
      type: String,
      required: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("holiday", holidaySchema);

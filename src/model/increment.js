const mongoose = require("mongoose");

const incrementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    previousSalary: {
      type: Number,
      required: true,
    },
    incrementPercentage: { type: Number },
    incrementAmount: { type: Number },
    totalSalary: {
      type: Number,
      required: true,
    },
    incrementMethod: {
      type: String,
      enum: ["monthly", "yearly"],
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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

module.exports = mongoose.model("Increment", incrementSchema);

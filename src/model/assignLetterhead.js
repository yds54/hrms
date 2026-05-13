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
      type: String,
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

assignLetterheadSchema.pre("save", async function () {
  if (!this.letterheadNumber) {
    const last = await this.constructor
      .findOne({ isDeleted: false })
      .sort({ letterheadNumber: -1 })
      .select("letterheadNumber")
      .lean();

    this.letterheadNumber = last ? last.letterheadNumber + 1 : 1;
  }
});

module.exports = mongoose.model("assignLetterhead", assignLetterheadSchema);

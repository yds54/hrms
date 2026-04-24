const mongoose = require("mongoose");
const { formatDate } = require("../utils/dateFormat");

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

holidaySchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.holidayDate = formatDate(ret.holidayDate);
    return ret;
  },
});

module.exports = mongoose.model("holiday", holidaySchema);

const mongoose = require("mongoose");
const moment = require("moment");
const { formatDate } = require("../utils/dateFormat");

const appreciatedUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "designation",
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return moment(this.date).endOf("month").toDate();
      },
    },
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
  { timestamps: true },
);

appreciatedUserSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.date) {
      ret.date = formatDate(ret.date);
    }
    return ret;
  },
});

module.exports = mongoose.model("appreciatedUser", appreciatedUserSchema);

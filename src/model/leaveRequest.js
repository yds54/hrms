const mongoose = require("mongoose");
const { formatDate } = require("../utils/dateFormat");
const {
  LEAVE_DAY_TYPE,
  LEAVE_STATUS,
  LEAVE_REASON_TYPE,
} = require("../utils/enum");

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    reasonType: {
      type: String,
      enum: Object.values(LEAVE_REASON_TYPE),
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfDays: {
      type: String,
      enum: Object.values(LEAVE_DAY_TYPE),
      required: true,
    },
    date: {
      type: Date,
    },
    isFullDay: {
      type: Boolean,
    },
    fromTime: {
      type: String,
    },
    toTime: {
      type: String,
    },
    fromDate: {
      type: Date,
    },
    toDate: {
      type: Date,
    },
    isPMApproved: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
    },
    isHRApproved: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
    },
    declineReason: {
      type: String,
      default: "",
    },
    totalDays: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

leaveRequestSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.date) ret.date = formatDate(ret.date);
    if (ret.fromDate) ret.fromDate = formatDate(ret.fromDate);
    if (ret.toDate) ret.toDate = formatDate(ret.toDate);
    return ret;
  },
});

// calculate total days
leaveRequestSchema.pre("save", function () {
  if (
    this.numberOfDays === LEAVE_DAY_TYPE.MULTIPLE &&
    this.fromDate &&
    this.toDate
  ) {
    const fromDate = new Date(this.fromDate);
    const toDate = new Date(this.toDate);

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    const diff = toDate - fromDate;
    this.totalDays = diff / (1000 * 60 * 60 * 24) + 1;
  }
  if (this.numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
    this.totalDays = this.isFullDay ? 1 : 0;
  }
});

leaveRequestSchema.index(
  { user: 1, date: 1 },
  { unique: true, partialFilterExpression: { numberOfDays: "Single Day" } },
);

module.exports = mongoose.model("leaveRequest", leaveRequestSchema);

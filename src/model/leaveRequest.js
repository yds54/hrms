const mongoose = require("mongoose");
const {
  LEAVE_DAY_TYPE,
  LEAVE_DURATION,
  LEAVE_STATUS,
} = require("../utils/enum");

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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
      type: Date, // for single day
    },

    fullHalfDay: {
      type: String,
      enum: Object.values(LEAVE_DURATION),
    },

    fromTime: {
      type: String,
    },

    toTime: {
      type: String,
    },

    fromDateTime: {
      type: Date, // for multiple day
    },

    toDateTime: {
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
      //type: Number,
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

// calculate total days
leaveRequestSchema.pre("save", function () {
  if (this.numberOfDays === LEAVE_DAY_TYPE.SINGLE) {
    if (this.fullHalfDay === LEAVE_DURATION.HALF) {
      this.totalDays = "-"; 
    } else {
      this.totalDays = 1;
    }
  } else if (
    this.numberOfDays === LEAVE_DAY_TYPE.MULTIPLE &&
    this.fromDateTime &&
    this.toDateTime
  ) {
    const from = new Date(this.fromDateTime);
    const to = new Date(this.toDateTime);

    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    const timeDiff = to - from;

    this.totalDays = timeDiff / (1000 * 3600 * 24) + 1; 
  }
});

leaveRequestSchema.index(
  { user: 1, date: 1 },
  { unique: true, partialFilterExpression: { numberOfDays: "Single Day" } }
);

module.exports = mongoose.model("leaveRequest", leaveRequestSchema);

const mongoose = require("mongoose");
const { LEAVE_DURATION } = require("../utils/enum");
const { parseTime } = require("../utils/timeFormat");
const { formatDate } = require("../utils/dateFormat");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    inTime: {
      type: String,
    },
    outTime: {
      type: String,
    },
    totalTime: {
      type: Number,
      default: 0,
    },
    overTime: {
      type: Number,
      default: 0,
    },
    extraMinutes: {
      type: Number,
      default: 0,
    },
    lateEntryDeduction: {
      type: Number,
      default: 0,
    },
    mode: {
      type: String,
    },
    totalMinutes: {
      type: Number,
    },
    isOverTime: {
      type: Boolean,
      default: false,
    },
    officeEntryTime: {
      type: String,
    },
    officeExitTime: {
      type: String,
    },
    lateEntryAfterMinutes: {
      type: String,
    },
    lateReason: {
      type: String,
    },
    leaveReason: {
      type: String,
    },
    overTimeReason: {
      type: String,
    },
    updateReason: {
      type: String,
    },
    entry: {
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
    exit: {
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
    deductedMinutes: {
      type: Number,
      default: 0,
    },
    permittedMinutes: {
      type: Number,
      default: 0,
    },
    usedCounter: {
      type: Number,
      default: 0,
    },
    leaveDay: {
      type: String,
      enum: Object.values(LEAVE_DURATION),
      default: LEAVE_DURATION.NONE,
    },
    leaveStatus: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.pre("save", function () {
  const inMinutes = parseTime(this.inTime);
  const outMinutes = parseTime(this.outTime);

  // Reset leave , deduction , overtime
  this.leaveDay = LEAVE_DURATION.NONE;
  this.leaveStatus = "";
  this.deductedMinutes = 0;
  this.overTime = 0;
  this.usedCounter = 0;

  // calculate total working min
  if (this.inTime && this.outTime) {
    this.totalTime = outMinutes - inMinutes;
  }

  // Full Day - no outTime
  if (this.inTime && !this.outTime) {
    this.leaveDay = LEAVE_DURATION.FULL;
    this.leaveStatus = "-";
    this.deductedMinutes = this.totalMinutes || 0;
    return;
  }

  // Half Day - workiing less
  if (this.inTime && this.outTime && this.totalTime < this.totalMinutes) {
    const diff = this.totalMinutes - this.totalTime;
    this.leaveDay = LEAVE_DURATION.HALF;
    this.leaveStatus = `${diff} minutes early`;
    this.deductedMinutes = diff;
  }

  // Overtime - working more
  if (this.inTime && this.outTime && this.totalTime > this.totalMinutes) {
    this.overTime = this.totalTime - this.totalMinutes;
  }
});

attendanceSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.date) {
      ret.date = formatDate(ret.date);
    }
    return ret;
  },
});

module.exports = mongoose.model("attendance", attendanceSchema);

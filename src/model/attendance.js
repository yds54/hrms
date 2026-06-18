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
      default: null,
    },
    outTime: {
      type: String,
      default: null,
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

attendanceSchema.pre("insertMany", function (attendances) {
  attendances.forEach((attendance) => {
    const inMinutes = parseTime(attendance.inTime);
    const outMinutes = parseTime(attendance.outTime);

    // Reset values
    attendance.leaveDay = LEAVE_DURATION.NONE;
    attendance.leaveStatus = "";
    attendance.deductedMinutes = 0;
    attendance.overTime = 0;
    attendance.usedCounter = 0;

    // Calculate total working time
    if (attendance.inTime && attendance.outTime) {
      attendance.totalTime = outMinutes - inMinutes;
    }

    // Full day
    if (attendance.inTime && !attendance.outTime) {
      attendance.leaveDay = LEAVE_DURATION.FULL;
      attendance.leaveStatus = "-";
      attendance.deductedMinutes = attendance.totalMinutes || 0;
      return;
    }

    // Half day
    if (
      attendance.inTime &&
      attendance.outTime &&
      attendance.totalTime < attendance.totalMinutes
    ) {
      const diff = attendance.totalMinutes - attendance.totalTime;

      attendance.leaveDay = LEAVE_DURATION.HALF;
      attendance.leaveStatus = `${diff} minutes early`;
      attendance.deductedMinutes = diff;
    }

    // Overtime
    if (
      attendance.inTime &&
      attendance.outTime &&
      attendance.totalTime > attendance.totalMinutes
    ) {
      attendance.overTime = attendance.totalTime - attendance.totalMinutes;
    }
  });
});

attendanceSchema.set("toJSON", {
  transform: (attendance, ret) => {
    if (ret.date) {
      ret.date = formatDate(ret.date);
    }
    return ret;
  },
});

module.exports = mongoose.model("attendance", attendanceSchema);

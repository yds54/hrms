const mongoose = require("mongoose");
const { LEAVE_DURATION } = require("../utils/enum");

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
      type: String,
    },
    exit: {
      type: String,
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

//attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const parseTime = (time) => {
  if (!time) return 0;
  const [t, modifier] = time.split(" ");
  let [h, m] = t.split(":").map(Number);
  if (modifier === "PM" && h !== 12) h += 12;
  if (modifier === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

attendanceSchema.pre("save", function () {
  const inMinutes = parseTime(this.inTime);
  const outMinutes = parseTime(this.outTime);
  const lateEntryLimit = parseTime(this.lateEntryAfterMinutes);

  // ----- total time calculation -----
  if (this.inTime && this.outTime) {
    this.totalTime = outMinutes - inMinutes;
  }

  // ----- no outTime (full day leave) -----
  if (this.inTime && !this.outTime) {
    const diff = this.totalMinutes;
    this.leaveDay = LEAVE_DURATION.FULL;
    this.leaveStatus = LEAVE_DURATION.NONE;
    this.deductedMinutes = diff;
    return;
  }

  //--------- early leave calculation - Half day -----
  if (this.totalTime < this.totalMinutes) {
    const diff = this.totalMinutes - this.totalTime;
    this.leaveDay = LEAVE_DURATION.HALF;
    this.leaveStatus = `${diff} minutes early`;
    this.deductedMinutes = diff;
  }

  // ----- overtime calculation -----
  if (this.totalTime > this.totalMinutes) {
    const diff = this.totalTime - this.totalMinutes;
    this.overTime = diff;
    this.extraMinutes = 0;
  }

  // ----- late entry -----
  if (this.inTime && this.lateEntryAfterMinutes) {
    this.usedCounter = inMinutes > lateEntryLimit ? 1 : 0;
  }
});

module.exports = mongoose.model("attendance", attendanceSchema);

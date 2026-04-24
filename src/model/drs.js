const mongoose = require("mongoose");
const { formatDate } = require("../utils/dateFormat");

const drsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    billableHours: { type: Number, default: 0 },
    nonBillableHours: { type: Number, default: 0 },
    projectsWorkedOn: { type: Number, default: 0 },
    estimationsGiven: { type: Number, default: 0 },
    interviewsGiven: { type: Number, default: 0 },
    interviewsCracked: { type: Number, default: 0 },
    bugSolvingHours: { type: Number, default: 0 },
    meetingsAttended: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    done: { type: String, default: "" },
    inProgress: { type: String, default: "" },
    nextPlan: { type: String, default: "" },
    onLeave: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

drsSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.date) {
      ret.date = formatDate(ret.date);
    }
    return ret;
  },
});

drsSchema.pre("save", function () {
  if (this.onLeave) {
    // if on leave all numbers = 0
    this.billableHours = 0;
    this.nonBillableHours = 0;

    this.interviewsGiven = 0;
    this.interviewsCracked = 0;

    this.bugSolvingHours = 0;
    this.meetingsAttended = 0;

    this.projectsWorkedOn = 0;
    this.estimationsGiven = 0;

    // all strings - on leave
    this.notes = "On Leave";
    this.done = "On Leave";
    this.inProgress = "On Leave";
    this.nextPlan = "On Leave";
  }
});

drsSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("drs", drsSchema);

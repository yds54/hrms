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
    factors: {
      type: Map,
      of: Number,
      default: {},
    },
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
    if (ret.factors instanceof Map) {
      ret.factors = Object.fromEntries(ret.factors);
    }
    return ret;
  },
});

drsSchema.pre("save", function () {
  if (this.onLeave) {
    // if on leave - all factor values = 0
    const updatedFactors = {};
    if (this.factors) {
      const factorEntries =
        this.factors instanceof Map
          ? this.factors.entries()
          : Object.entries(this.factors);

      for (const [key] of factorEntries) {
        updatedFactors[key] = 0;
      }
    }

    this.factors = updatedFactors;

    // all strings - on leave
    this.notes = "On Leave";
    this.done = "On Leave";
    this.inProgress = "On Leave";
    this.nextPlan = "On Leave";
  }
});

drsSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("drs", drsSchema);

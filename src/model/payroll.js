const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    stipendAmount: { type: Number },
    salaryAmount: { type: Number },
    incrementType: { type: String },
    trainingStartDate: { type: Date },
    trainingDurationInMonths: { type: Number },
    trainingEndDate: { type: Date },
    joiningDate: { type: Date },
    isBond: { type: Boolean },
    bondDurationInMonths: { type: Number },
    bondCompletedDate: { type: Date },
    nda: { type: Boolean },
    ctcTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      //ref: "CTCTemplate",
    },
    remark: { type: String },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
payrollSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.User = ret.userId;
    delete ret.userId;
    return ret;
  },
});
module.exports = mongoose.model("payroll", payrollSchema);

const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
  {
    designationName: {
      type: String,
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
    },
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
designationSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.department = ret.departmentId;
    delete ret.departmentId;
    return ret;
  },
});

module.exports = mongoose.model("designation", designationSchema);

const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    updatedBy: String,
    deletedBy: String,
  },
  {
    timestamps: true,
  }
);

module.exports=mongoose.model("Department",departmentSchema)
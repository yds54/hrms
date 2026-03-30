const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
  {
    designationName: {
      type: String,
      required: true,
    },

    departmentName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
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

module.exports=mongoose.model("Designation",designationSchema)
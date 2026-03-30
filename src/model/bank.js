const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema(
  {
    bankName: {
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

module.exports=mongoose.model("bank",bankSchema)
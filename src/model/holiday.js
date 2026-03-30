const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    holidayDate: {
      type: Date,
      required: true,
    },

    holidayReason: {
      type: String,
      required: true,
      trim: true,
    },

    srNo:Number,

    month: {
      type: Number, 
    },

    year: {
      type: Number,
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

module.exports = mongoose.model("Holiday", holidaySchema);
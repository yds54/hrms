const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },

    headHR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", 
      default: null,
    },

    organizationAddress: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String, 
      default: null,
    },

    organizationAccountNumber: {
      type: String,
      trim: true,
    },

    irregularEmployeeCriteria: {
      days: {
        type: Number,
        default: 10,
      },
      beforePercentage: {
        type: Number,
        default: 3,
      },
      afterPercentage: {
        type: Number,
        default: 5,
      },
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    updatedBy: {
      type: String,
    },

    deletedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("organization", organizationSchema);
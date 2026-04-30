const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: null,
    },
    remark: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const otherDocumentSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      default: null,
    },
    path: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      default: null,
    },
    remark: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const userDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    documentsTakenDate: {
      type: Date,
      required: true,
    },
    offerLetter: {
      type: documentSchema,
      default: {},
    },
    appointmentLetter: {
      type: documentSchema,
      default: {},
    },
    tenthMarksheet: {
      type: documentSchema,
      default: {},
    },
    twelfthOrDiplomaMarksheet: {
      type: documentSchema,
      default: {},
    },
    twelfthOrDiplomaType: {
      type: String,
      enum: ["12th", "Diploma"],
    },
    bachelorsCertificate: {
      type: documentSchema,
      default: {},
    },
    mastersDegreeMarksheet: {
      type: documentSchema,
      default: {},
    },
    panCard: {
      type: {
        fileName: {
          type: String,
          default: null,
        },
        path: {
          type: String,
          default: null,
        },
        fileType: {
          type: String,
          default: null,
        },
        panNumber: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
          default: "",
        },
      },
      default: {},
    },

    otherDocuments: {
      type: [otherDocumentSchema],
      default: [],
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
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

userDocumentSchema.set("toObject", {
  transform: function (doc, ret) {
    ret.User = ret.userId;
    delete ret.userId;
    return ret;
  },
});

module.exports = mongoose.model("userDocument", userDocumentSchema);

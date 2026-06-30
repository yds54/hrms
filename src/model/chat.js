const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participantOne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    participantTwo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      required: true,
    },
    participantKey: {
      type: String,
      index: true,
    },
    lastMessage: {
      text: String,
      timestamp: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeletedByOne: {
      type: Boolean,
      default: false,
    },
    isDeletedByTwo: {
      type: Boolean,
      default: false,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    initialMessage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "chats",
  },
);

chatSchema.pre("validate", function (next) {
  if (this.participantOne && this.participantTwo) {
    this.participantKey = [this.participantOne, this.participantTwo]
      .map((id) => id.toString())
      .sort()
      .join(":");
  }
});

chatSchema.index({ participantOne: 1, participantTwo: 1, organizationId: 1 });
chatSchema.index(
  { organizationId: 1, participantKey: 1 },
  {
    unique: true,
    partialFilterExpression: { participantKey: { $exists: true } },
  },
);
chatSchema.index({ organizationId: 1 });
chatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);

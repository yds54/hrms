const mongoose = require("mongoose");

const userStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: String,
    socketIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "userStatus",
  },
);

userStatusSchema.index({ isOnline: 1 });

module.exports = mongoose.model("UserStatus", userStatusSchema);

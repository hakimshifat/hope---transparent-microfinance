const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info"
    },
    link: { type: String, trim: true },
    readAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

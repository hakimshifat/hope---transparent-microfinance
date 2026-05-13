const express = require("express");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  })
);

router.patch(
  "/:id/read",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  })
);

router.patch(
  "/read-all",
  protect,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user._id, $or: [{ readAt: null }, { readAt: { $exists: false } }] },
      { readAt: new Date() }
    );
    res.json({ message: "Notifications marked as read" });
  })
);

module.exports = router;

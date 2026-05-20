const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    res.json(notifications);
  })
);

router.patch(
  "/:id/read",
  protect,
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return res.status(404).json({ message: "Notification not found" });

    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() }
    });
    res.json(notification);
  })
);

router.patch(
  "/read-all",
  protect,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() }
    });
    res.json({ message: "Notifications marked as read" });
  })
);

module.exports = router;

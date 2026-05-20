const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: { select: { fullName: true, phone: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(logs);
  })
);

module.exports = router;

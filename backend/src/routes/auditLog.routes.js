const express = require("express");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const logs = await AuditLog.find()
      .populate("actorId", "fullName phone role")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  })
);

module.exports = router;

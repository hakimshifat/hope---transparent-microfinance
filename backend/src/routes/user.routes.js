const express = require("express");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
const roles = ["borrower", "field_officer", "supervisor", "admin"];
const statuses = ["active", "inactive", "pending"];

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  })
);

router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { fullName, phone, password, role = "borrower", status = "active" } = req.body;
    const email = req.body.email || undefined;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: "fullName, phone and password are required" });
    }

    if (!roles.includes(role) || !statuses.includes(status)) {
      return res.status(400).json({ message: "Invalid role or status" });
    }

    const user = await User.create({ fullName, phone, email, password, role, status });
    res.status(201).json(user);
  })
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!statuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  })
);

router.patch(
  "/:id/role",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!roles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (String(req.user._id) === req.params.id && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin role" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  })
);

module.exports = router;

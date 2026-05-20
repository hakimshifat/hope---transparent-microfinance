const express = require("express");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
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
    const users = await prisma.user.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });
    const safeUsers = users.map((u) => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(safeUsers);
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName, phone, email, password: hashedPassword, role, status },
    });

    const safeUser = { ...user };
    delete safeUser.password;
    res.status(201).json(safeUser);
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

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { status },
      });
      const safeUser = { ...user };
      delete safeUser.password;
      res.json(safeUser);
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ message: "User not found" });
      throw error;
    }
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

    if (String(req.user.id) === req.params.id && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin role" });
    }

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role },
      });
      const safeUser = { ...user };
      delete safeUser.password;
      res.json(safeUser);
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ message: "User not found" });
      throw error;
    }
  })
);

module.exports = router;

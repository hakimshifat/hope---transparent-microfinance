const express = require("express");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const { protect, signToken } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { fullName, phone, password } = req.body;
    const email = req.body.email || undefined;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: "fullName, phone and password are required" });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ message: "A user with this phone or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email,
        password: hashedPassword,
        role: "borrower",
        status: "active"
      }
    });

    const safeUser = { ...user };
    delete safeUser.password;

    res.status(201).json({ token: signToken(user), user: safeUser });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { identifier, phone, email, password } = req.body;
    const loginId = identifier || phone || email;

    if (!loginId || !password) {
      return res.status(400).json({ message: "Login identifier and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: loginId },
          { email: loginId.toLowerCase() }
        ]
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    const safeUser = { ...user };
    delete safeUser.password;

    res.json({ token: signToken(user), user: safeUser });
  })
);

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

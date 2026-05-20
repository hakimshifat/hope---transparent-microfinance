const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { notifyUser } = require("../utils/notify");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

function profilePayload(body, user) {
  return {
    fullName: body.fullName || user.fullName,
    phone: body.phone || user.phone,
    address: body.address,
    occupation: body.occupation,
    monthlyIncome: body.monthlyIncome,
    nidNumber: body.nidNumber,
    nidImageUrl: body.nidImageUrl,
    nomineeName: body.nomineeName,
    nomineePhone: body.nomineePhone
  };
}

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const profiles = await prisma.borrowerProfile.findMany({
      include: {
        user: { select: { fullName: true, phone: true, email: true, status: true } },
        verifiedBy: { select: { fullName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(profiles);
  })
);

router.post(
  "/profile",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.borrowerProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) return res.status(409).json({ message: "Profile already exists" });

    const payload = profilePayload(req.body, req.user);
    if (!payload.address || !payload.occupation || !payload.monthlyIncome || !payload.nidNumber) {
      return res.status(400).json({ message: "Address, occupation, monthlyIncome and nidNumber are required" });
    }

    const profile = await prisma.borrowerProfile.create({
      data: { ...payload, userId: req.user.id }
    });

    await writeAudit(
      req.user,
      "borrower_profile_created",
      "BorrowerProfile",
      profile.id,
      `Borrower ${req.user.fullName} created their profile`
    );

    await notifyUser(req.user.id, {
      title: "Profile submitted",
      message: "Your borrower profile was submitted for verification.",
      type: "info",
      link: "/profile"
    });

    res.status(201).json(profile);
  })
);

router.get(
  "/me",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const profile = await prisma.borrowerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  })
);

router.patch(
  "/profile",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    try {
      const profile = await prisma.borrowerProfile.update({
        where: { userId: req.user.id },
        data: { ...profilePayload(req.body, req.user), verificationStatus: "pending" }
      });

      await writeAudit(
        req.user,
        "borrower_profile_updated",
        "BorrowerProfile",
        profile.id,
        `Borrower ${req.user.fullName} updated their profile (status reset to pending)`
      );

      await notifyUser(req.user.id, {
        title: "Profile updated",
        message: "Your profile was updated and sent back for verification.",
        type: "info",
        link: "/profile"
      });

      res.json(profile);
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ message: "Profile not found" });
      throw error;
    }
  })
);

router.patch(
  "/:id/verify",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const { verificationStatus, verificationNotes } = req.body;
    if (!["verified", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({ message: "verificationStatus must be verified or rejected" });
    }

    let profile = await prisma.borrowerProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      profile = await prisma.borrowerProfile.findUnique({ where: { userId: req.params.id } });
    }

    if (!profile) return res.status(404).json({ message: "Borrower profile not found" });

    profile = await prisma.borrowerProfile.update({
      where: { id: profile.id },
      data: {
        verificationStatus,
        verificationNotes,
        verifiedById: req.user.id,
        verifiedAt: new Date()
      }
    });

    await writeAudit(
      req.user,
      `borrower_${verificationStatus}`,
      "BorrowerProfile",
      profile.id,
      `${req.user.fullName} marked borrower profile as ${verificationStatus}`
    );

    await notifyUser(profile.userId, {
      title: verificationStatus === "verified" ? "Profile verified" : "Profile rejected",
      message: verificationStatus === "verified"
        ? "Your borrower profile has been verified. You can apply for eligible loan products."
        : verificationNotes || "Your borrower profile was rejected. Please update and resubmit your information.",
      type: verificationStatus === "verified" ? "success" : "danger",
      link: "/profile"
    });

    res.json(profile);
  })
);

module.exports = router;

const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { notifyUser } = require("../utils/notify");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const VALID_OCCUPATIONS = [
  "Farmer / Agriculture",
  "Day Laborer",
  "Garment Worker",
  "Small Business / Shopkeeper",
  "Rickshaw / Van Puller",
  "Domestic Worker",
  "Handicraft / Artisan",
  "Poultry / Livestock",
  "Fisherman",
  "Tailor",
  "Teacher / Tutor",
  "Student",
  "Other"
];

function profilePayload(body, user) {
  return {
    fullName: body.fullName?.trim() || user.fullName,
    phone: body.phone?.trim() || user.phone,
    address: body.address?.trim(),
    occupation: body.occupation?.trim(),
    monthlyIncome: body.monthlyIncome !== undefined ? Number(body.monthlyIncome) : undefined,
    nidNumber: body.nidNumber?.trim(),
    nidImageUrl: body.nidImageUrl,
    nomineeName: body.nomineeName?.trim() || null,
    nomineePhone: body.nomineePhone?.trim() || null
  };
}

function validateProfileData(payload) {
  const errors = [];
  
  if (payload.fullName && payload.fullName.length < 3) errors.push("Full name is too short.");
  if (payload.phone && !/^\+?\d{10,15}$/.test(payload.phone.replace(/\s/g, ""))) errors.push("Invalid phone number format.");
  if (payload.address !== undefined && payload.address.length < 5) errors.push("Address is too short.");
  
  if (payload.occupation !== undefined && !VALID_OCCUPATIONS.includes(payload.occupation)) {
    errors.push("Invalid occupation selected.");
  }

  if (payload.monthlyIncome !== undefined) {
    if (isNaN(payload.monthlyIncome) || payload.monthlyIncome < 0 || payload.monthlyIncome > 100000000) {
      errors.push("Monthly income must be a valid positive number.");
    }
  }

  if (payload.nidNumber !== undefined) {
    if (!/^\d+$/.test(payload.nidNumber)) errors.push("NID must contain only numbers.");
    if (![13, 15, 17].includes(payload.nidNumber.length)) errors.push("NID must be exactly 13, 15, or 17 digits.");
  }

  if (payload.nomineeName && payload.nomineeName.length < 3) {
    errors.push("Nominee name is too short.");
  }

  if (payload.nomineePhone && !/^\+?\d{10,15}$/.test(payload.nomineePhone.replace(/\s/g, ""))) {
    errors.push("Invalid nominee phone number format.");
  }

  return errors;
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
    if (!payload.address || !payload.occupation || payload.monthlyIncome === undefined || !payload.nidNumber) {
      return res.status(400).json({ message: "Address, occupation, monthlyIncome and nidNumber are required" });
    }

    const errors = validateProfileData(payload);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(" ") });
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
      const payload = profilePayload(req.body, req.user);
      const errors = validateProfileData(payload);
      if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(" ") });
      }

      const profile = await prisma.borrowerProfile.update({
        where: { userId: req.user.id },
        data: { ...payload, verificationStatus: "pending" }
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

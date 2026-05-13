const express = require("express");
const BorrowerProfile = require("../models/BorrowerProfile");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
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
    const profiles = await BorrowerProfile.find()
      .populate("userId", "fullName phone email status")
      .populate("verifiedBy", "fullName role")
      .sort({ createdAt: -1 });
    res.json(profiles);
  })
);

router.post(
  "/profile",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const existing = await BorrowerProfile.findOne({ userId: req.user._id });
    if (existing) return res.status(409).json({ message: "Profile already exists" });

    const payload = profilePayload(req.body, req.user);
    if (!payload.address || !payload.occupation || !payload.monthlyIncome || !payload.nidNumber) {
      return res.status(400).json({ message: "Address, occupation, monthlyIncome and nidNumber are required" });
    }

    const profile = await BorrowerProfile.create({ ...payload, userId: req.user._id });

    await writeAudit(
      req.user,
      "borrower_profile_created",
      "BorrowerProfile",
      profile._id,
      `Borrower ${req.user.fullName} created their profile`
    );

    res.status(201).json(profile);
  })
);

router.get(
  "/me",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const profile = await BorrowerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  })
);

router.patch(
  "/profile",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const profile = await BorrowerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { ...profilePayload(req.body, req.user), verificationStatus: "pending" },
      { new: true, runValidators: true }
    );

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    await writeAudit(
      req.user,
      "borrower_profile_updated",
      "BorrowerProfile",
      profile._id,
      `Borrower ${req.user.fullName} updated their profile (status reset to pending)`
    );

    res.json(profile);
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

    const profile =
      (await BorrowerProfile.findById(req.params.id)) ||
      (await BorrowerProfile.findOne({ userId: req.params.id }));

    if (!profile) return res.status(404).json({ message: "Borrower profile not found" });

    profile.verificationStatus = verificationStatus;
    profile.verificationNotes = verificationNotes;
    profile.verifiedBy = req.user._id;
    profile.verifiedAt = new Date();
    await profile.save();

    await writeAudit(
      req.user,
      `borrower_${verificationStatus}`,
      "BorrowerProfile",
      profile._id,
      `${req.user.fullName} marked borrower profile as ${verificationStatus}`
    );

    res.json(profile);
  })
);

module.exports = router;

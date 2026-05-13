const express = require("express");
const Receipt = require("../models/Receipt");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const receipts = await Receipt.find({ borrowerId: req.user._id })
      .populate("installmentId")
      .populate("approvedBy", "fullName role")
      .sort({ paymentDate: -1 });
    res.json(receipts);
  })
);

router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const receipt = await Receipt.findById(req.params.id)
      .populate("borrowerId", "fullName phone")
      .populate("installmentId")
      .populate("approvedBy", "fullName role");

    if (!receipt) return res.status(404).json({ message: "Receipt not found" });
    const isOwner = req.user.role === "borrower" && String(receipt.borrowerId._id) === String(req.user._id);
    const isReviewer = ["admin", "supervisor"].includes(req.user.role);

    if (!isOwner && !isReviewer) {
      return res.status(403).json({ message: "You do not have permission to view this receipt" });
    }

    res.json(receipt);
  })
);

module.exports = router;

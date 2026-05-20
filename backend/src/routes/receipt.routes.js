const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const receipts = await prisma.receipt.findMany({
      where: { borrowerId: req.user.id },
      include: {
        installment: true,
        approvedBy: { select: { fullName: true, role: true } }
      },
      orderBy: { paymentDate: 'desc' }
    });
    res.json(receipts);
  })
);

router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id },
      include: {
        borrower: { select: { fullName: true, phone: true } },
        installment: true,
        approvedBy: { select: { fullName: true, role: true } }
      }
    });

    if (!receipt) return res.status(404).json({ message: "Receipt not found" });
    const isOwner = req.user.role === "borrower" && String(receipt.borrowerId) === String(req.user.id);
    const isReviewer = ["admin", "supervisor"].includes(req.user.role);

    if (!isOwner && !isReviewer) {
      return res.status(403).json({ message: "You do not have permission to view this receipt" });
    }

    res.json(receipt);
  })
);

module.exports = router;

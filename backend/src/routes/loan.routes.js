const express = require("express");
const Loan = require("../models/Loan");
const OverdueCase = require("../models/OverdueCase");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

async function canAccessLoan(user, loan) {
  if (["admin", "supervisor"].includes(user.role)) return true;
  if (user.role === "borrower" && String(loan.borrowerId._id || loan.borrowerId) === String(user._id)) return true;
  if (user.role === "field_officer") {
    const assignedCase = await OverdueCase.findOne({ loanId: loan._id, assignedOfficerId: user._id });
    return Boolean(assignedCase);
  }
  return false;
}

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const loans = await Loan.find({ borrowerId: req.user._id })
      .populate("loanProductId")
      .populate("approvedBy", "fullName role")
      .sort({ createdAt: -1 });
    res.json(loans);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const loans = await Loan.find()
      .populate("borrowerId", "fullName phone")
      .populate("loanProductId")
      .populate("approvedBy", "fullName role")
      .sort({ createdAt: -1 });
    res.json(loans);
  })
);

router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const loan = await Loan.findById(req.params.id)
      .populate("borrowerId", "fullName phone email")
      .populate("loanProductId")
      .populate("approvedBy", "fullName role");

    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (!(await canAccessLoan(req.user, loan))) {
      return res.status(403).json({ message: "You do not have permission to view this loan" });
    }

    res.json(loan);
  })
);

module.exports = router;

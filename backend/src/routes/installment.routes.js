const express = require("express");
const Installment = require("../models/Installment");
const Loan = require("../models/Loan");
const OverdueCase = require("../models/OverdueCase");
const asyncHandler = require("../utils/asyncHandler");
const { refreshOverdueInstallments } = require("../utils/overdue");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

async function canAccessLoanInstallments(user, loanId) {
  if (["admin", "supervisor"].includes(user.role)) return true;
  const loan = await Loan.findById(loanId);
  if (!loan) return false;
  if (user.role === "borrower" && String(loan.borrowerId) === String(user._id)) return true;
  if (user.role === "field_officer") {
    const assignedCase = await OverdueCase.findOne({ loanId, assignedOfficerId: user._id });
    return Boolean(assignedCase);
  }
  return false;
}

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    await refreshOverdueInstallments();
    const installments = await Installment.find({ borrowerId: req.user._id })
      .populate("loanId")
      .sort({ dueDate: 1 });
    res.json(installments);
  })
);

router.get(
  "/loan/:loanId",
  protect,
  asyncHandler(async (req, res) => {
    if (!(await canAccessLoanInstallments(req.user, req.params.loanId))) {
      return res.status(403).json({ message: "You do not have permission to view this schedule" });
    }

    await refreshOverdueInstallments();
    const installments = await Installment.find({ loanId: req.params.loanId }).sort({ installmentNumber: 1 });
    res.json(installments);
  })
);

router.patch(
  "/update-overdue",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const updatedCount = await refreshOverdueInstallments();
    res.json({ updatedCount });
  })
);

module.exports = router;

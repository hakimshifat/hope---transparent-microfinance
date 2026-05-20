const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { refreshOverdueInstallments } = require("../utils/overdue");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

async function canAccessLoanInstallments(user, loanId) {
  if (["admin", "supervisor"].includes(user.role)) return true;
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) return false;
  if (user.role === "borrower" && String(loan.borrowerId) === String(user.id)) return true;
  if (user.role === "field_officer") {
    const assignedCase = await prisma.overdueCase.findFirst({ where: { loanId, assignedOfficerId: user.id } });
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
    const installments = await prisma.installment.findMany({
      where: { borrowerId: req.user.id },
      include: { loan: true },
      orderBy: { dueDate: 'asc' }
    });
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
    const installments = await prisma.installment.findMany({
      where: { loanId: req.params.loanId },
      orderBy: { installmentNumber: 'asc' }
    });
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

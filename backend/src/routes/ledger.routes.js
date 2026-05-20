const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { roundMoney } = require("../utils/loanCalculator");
const { refreshOverdueInstallments } = require("../utils/overdue");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

async function canViewBorrowerLedger(user, borrowerId) {
  if (["admin", "supervisor"].includes(user.role)) return true;
  if (user.role === "borrower" && String(user.id) === String(borrowerId)) return true;
  if (user.role === "field_officer") {
    const assignedCase = await prisma.overdueCase.findFirst({ where: { borrowerId, assignedOfficerId: user.id } });
    return Boolean(assignedCase);
  }
  return false;
}

async function buildLedger(borrowerId) {
  await refreshOverdueInstallments();

  const borrower = await prisma.user.findUnique({
    where: { id: borrowerId },
    select: { fullName: true, phone: true, email: true }
  });
  const loans = await prisma.loan.findMany({
    where: { borrowerId },
    include: { loanProduct: true },
    orderBy: { createdAt: 'desc' }
  });
  const activeLoan = loans.find((loan) => loan.loanStatus === "active") || loans[0] || null;

  if (!activeLoan) {
    return {
      borrower,
      loan: null,
      summary: {
        loanAmount: 0,
        serviceCharge: 0,
        totalPayable: 0,
        totalPaid: 0,
        totalRemaining: 0,
        dueAmount: 0,
        overdueAmount: 0,
        nextDueDate: null
      },
      installments: [],
      paymentHistory: [],
      receipts: []
    };
  }

  const [installments, payments, receipts] = await Promise.all([
    prisma.installment.findMany({ where: { loanId: activeLoan.id }, orderBy: { installmentNumber: 'asc' } }),
    prisma.payment.findMany({ where: { loanId: activeLoan.id }, orderBy: { submittedAt: 'desc' } }),
    prisma.receipt.findMany({ where: { loanId: activeLoan.id }, orderBy: { paymentDate: 'desc' } })
  ]);

  const approvedPayments = payments.filter((payment) => payment.paymentStatus === "approved");
  const totalPaid = roundMoney(approvedPayments.reduce((sum, payment) => sum + payment.amount, 0));
  const now = new Date();

  const unpaidInstallments = installments.filter((item) => item.amountPaid < item.amountDue);
  const dueAmount = roundMoney(
    unpaidInstallments
      .filter((item) => item.dueDate <= now)
      .reduce((sum, item) => sum + (item.amountDue - item.amountPaid), 0)
  );
  const overdueAmount = roundMoney(
    unpaidInstallments
      .filter((item) => item.dueDate < now)
      .reduce((sum, item) => sum + (item.amountDue - item.amountPaid), 0)
  );
  const nextDue = unpaidInstallments.sort((a, b) => a.dueDate - b.dueDate)[0];

  return {
    borrower,
    loan: activeLoan,
    summary: {
      loanAmount: activeLoan.principalAmount,
      serviceCharge: activeLoan.serviceChargeAmount,
      totalPayable: activeLoan.totalPayableAmount,
      totalPaid,
      totalRemaining: roundMoney(activeLoan.totalPayableAmount - totalPaid),
      dueAmount,
      overdueAmount,
      nextDueDate: nextDue ? nextDue.dueDate : null
    },
    installments,
    paymentHistory: payments,
    receipts
  };
}

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    res.json(await buildLedger(req.user.id));
  })
);

router.get(
  "/:borrowerId",
  protect,
  asyncHandler(async (req, res) => {
    if (!(await canViewBorrowerLedger(req.user, req.params.borrowerId))) {
      return res.status(403).json({ message: "You do not have permission to view this ledger" });
    }

    res.json(await buildLedger(req.params.borrowerId));
  })
);

module.exports = router;

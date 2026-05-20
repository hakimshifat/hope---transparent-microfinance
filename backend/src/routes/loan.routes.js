const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

async function canAccessLoan(user, loan) {
  if (["admin", "supervisor"].includes(user.role)) return true;
  if (user.role === "borrower" && String(loan.borrowerId) === String(user.id)) return true;
  if (user.role === "field_officer") {
    const assignedCase = await prisma.overdueCase.findFirst({
      where: { loanId: loan.id, assignedOfficerId: user.id }
    });
    return Boolean(assignedCase);
  }
  return false;
}

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const loans = await prisma.loan.findMany({
      where: { borrowerId: req.user.id },
      include: {
        loanProduct: true,
        approvedBy: { select: { fullName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const loans = await prisma.loan.findMany({
      include: {
        borrower: { select: { fullName: true, phone: true } },
        loanProduct: true,
        approvedBy: { select: { fullName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  })
);

router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: {
        borrower: { select: { fullName: true, phone: true, email: true } },
        loanProduct: true,
        approvedBy: { select: { fullName: true, role: true } }
      }
    });

    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (!(await canAccessLoan(req.user, loan))) {
      return res.status(403).json({ message: "You do not have permission to view this loan" });
    }

    res.json(loan);
  })
);

module.exports = router;

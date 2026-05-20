const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { buildLoanData, buildInstallmentSchedule } = require("../utils/loanCalculator");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

async function ensureBorrowerCanApply(userId) {
  const profile = await prisma.borrowerProfile.findUnique({ where: { userId } });
  if (!profile) {
    const error = new Error("Complete borrower profile before applying");
    error.statusCode = 400;
    throw error;
  }

  const requiredFields = ["address", "occupation", "monthlyIncome", "nidNumber"];
  const missingField = requiredFields.find((field) => !profile[field]);
  if (missingField) {
    const error = new Error("Borrower profile is incomplete");
    error.statusCode = 400;
    throw error;
  }

  const activeLoan = await prisma.loan.findFirst({ where: { borrowerId: userId, loanStatus: "active" } });
  if (activeLoan) {
    const error = new Error("Borrower cannot have more than one active loan");
    error.statusCode = 400;
    throw error;
  }

  return profile;
}

router.post(
  "/",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const { loanProductId, requestedAmount, purpose } = req.body;
    if (!loanProductId || !requestedAmount || !purpose) {
      return res.status(400).json({ message: "loanProductId, requestedAmount and purpose are required" });
    }

    await ensureBorrowerCanApply(req.user.id);

    const product = await prisma.loanProduct.findFirst({ where: { id: loanProductId, status: "active" } });
    if (!product) return res.status(404).json({ message: "Active loan product not found" });

    if (requestedAmount < product.minAmount || requestedAmount > product.maxAmount) {
      return res.status(400).json({ message: "Requested amount is outside product limits" });
    }

    const application = await prisma.loanApplication.create({
      data: {
        borrowerId: req.user.id,
        loanProductId,
        requestedAmount,
        purpose
      }
    });

    res.status(201).json(application);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const applications = await prisma.loanApplication.findMany({
      include: {
        borrower: { select: { fullName: true, phone: true } },
        loanProduct: true,
        reviewedBy: { select: { fullName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  })
);

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const applications = await prisma.loanApplication.findMany({
      where: { borrowerId: req.user.id },
      include: {
        loanProduct: true,
        reviewedBy: { select: { fullName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  })
);

router.patch(
  "/:id/approve",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const application = await prisma.loanApplication.findUnique({
      where: { id: req.params.id },
      include: { loanProduct: true }
    });
    if (!application) return res.status(404).json({ message: "Loan application not found" });
    if (application.applicationStatus !== "pending") {
      return res.status(400).json({ message: "Only pending applications can be approved" });
    }

    const profile = await prisma.borrowerProfile.findUnique({ where: { userId: application.borrowerId } });
    if (!profile || profile.verificationStatus !== "verified") {
      return res.status(400).json({ message: "Borrower must be verified before approval" });
    }

    const activeLoan = await prisma.loan.findFirst({ where: { borrowerId: application.borrowerId, loanStatus: "active" } });
    if (activeLoan) {
      return res.status(400).json({ message: "Borrower already has an active loan" });
    }

    const product = application.loanProduct;
    const loanData = buildLoanData({
      borrowerId: application.borrowerId,
      product,
      principalAmount: application.requestedAmount,
      approvedBy: req.user.id
    });

    // Generate UUID for loan
    const loan = await prisma.loan.create({
      data: loanData
    });

    const schedule = buildInstallmentSchedule(loan).map(item => ({
      ...item,
      dueDate: new Date(item.dueDate)
    }));
    await prisma.installment.createMany({ data: schedule });

    const updatedApp = await prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        applicationStatus: "approved",
        reviewedById: req.user.id,
        reviewedAt: new Date()
      }
    });

    await writeAudit(
      req.user,
      "loan_application_approved",
      "LoanApplication",
      updatedApp.id,
      `Approved loan application and created loan ${loan.id}`
    );

    res.json({ application: updatedApp, loan });
  })
);

router.patch(
  "/:id/reject",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const { rejectionReason } = req.body;
    let application = await prisma.loanApplication.findUnique({ where: { id: req.params.id } });
    if (!application) return res.status(404).json({ message: "Loan application not found" });
    if (application.applicationStatus !== "pending") {
      return res.status(400).json({ message: "Only pending applications can be rejected" });
    }

    application = await prisma.loanApplication.update({
      where: { id: req.params.id },
      data: {
        applicationStatus: "rejected",
        rejectionReason: rejectionReason || "Application rejected",
        reviewedById: req.user.id,
        reviewedAt: new Date()
      }
    });

    await writeAudit(
      req.user,
      "loan_application_rejected",
      "LoanApplication",
      application.id,
      `Rejected loan application: ${application.rejectionReason}`
    );

    res.json(application);
  })
);

module.exports = router;

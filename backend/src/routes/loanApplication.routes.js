const express = require("express");
const BorrowerProfile = require("../models/BorrowerProfile");
const Installment = require("../models/Installment");
const Loan = require("../models/Loan");
const LoanApplication = require("../models/LoanApplication");
const LoanProduct = require("../models/LoanProduct");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { buildLoanData, buildInstallmentSchedule } = require("../utils/loanCalculator");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

async function ensureBorrowerCanApply(userId) {
  const profile = await BorrowerProfile.findOne({ userId });
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

  const activeLoan = await Loan.findOne({ borrowerId: userId, loanStatus: "active" });
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

    await ensureBorrowerCanApply(req.user._id);

    const product = await LoanProduct.findOne({ _id: loanProductId, status: "active" });
    if (!product) return res.status(404).json({ message: "Active loan product not found" });

    if (requestedAmount < product.minAmount || requestedAmount > product.maxAmount) {
      return res.status(400).json({ message: "Requested amount is outside product limits" });
    }

    const application = await LoanApplication.create({
      borrowerId: req.user._id,
      loanProductId,
      requestedAmount,
      purpose
    });

    res.status(201).json(application);
  })
);

router.get(
  "/",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const applications = await LoanApplication.find()
      .populate("borrowerId", "fullName phone")
      .populate("loanProductId")
      .populate("reviewedBy", "fullName role")
      .sort({ createdAt: -1 });
    res.json(applications);
  })
);

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const applications = await LoanApplication.find({ borrowerId: req.user._id })
      .populate("loanProductId")
      .populate("reviewedBy", "fullName role")
      .sort({ createdAt: -1 });
    res.json(applications);
  })
);

router.patch(
  "/:id/approve",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const application = await LoanApplication.findById(req.params.id).populate("loanProductId");
    if (!application) return res.status(404).json({ message: "Loan application not found" });
    if (application.applicationStatus !== "pending") {
      return res.status(400).json({ message: "Only pending applications can be approved" });
    }

    const profile = await BorrowerProfile.findOne({ userId: application.borrowerId });
    if (!profile || profile.verificationStatus !== "verified") {
      return res.status(400).json({ message: "Borrower must be verified before approval" });
    }

    const activeLoan = await Loan.findOne({ borrowerId: application.borrowerId, loanStatus: "active" });
    if (activeLoan) {
      return res.status(400).json({ message: "Borrower already has an active loan" });
    }

    const product = application.loanProductId;
    const loan = await Loan.create(
      buildLoanData({
        borrowerId: application.borrowerId,
        product,
        principalAmount: application.requestedAmount,
        approvedBy: req.user._id
      })
    );

    await Installment.insertMany(buildInstallmentSchedule(loan));

    application.applicationStatus = "approved";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    await writeAudit(
      req.user,
      "loan_application_approved",
      "LoanApplication",
      application._id,
      `Approved loan application and created loan ${loan._id}`
    );

    res.json({ application, loan });
  })
);

router.patch(
  "/:id/reject",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const { rejectionReason } = req.body;
    const application = await LoanApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Loan application not found" });
    if (application.applicationStatus !== "pending") {
      return res.status(400).json({ message: "Only pending applications can be rejected" });
    }

    application.applicationStatus = "rejected";
    application.rejectionReason = rejectionReason || "Application rejected";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    await writeAudit(
      req.user,
      "loan_application_rejected",
      "LoanApplication",
      application._id,
      `Rejected loan application: ${application.rejectionReason}`
    );

    res.json(application);
  })
);

module.exports = router;

const express = require("express");
const Installment = require("../models/Installment");
const Loan = require("../models/Loan");
const Payment = require("../models/Payment");
const Receipt = require("../models/Receipt");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { roundMoney } = require("../utils/loanCalculator");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

function receiptNumber() {
  return `HOPE-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

router.post(
  "/",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const { installmentId, amount, paymentMethod, transactionId } = req.body;
    if (!installmentId || !amount || !paymentMethod || !transactionId) {
      return res.status(400).json({ message: "installmentId, amount, paymentMethod and transactionId are required" });
    }

    const installment = await Installment.findById(installmentId);
    if (!installment || String(installment.borrowerId) !== String(req.user._id)) {
      return res.status(404).json({ message: "Installment not found" });
    }

    if (installment.status === "paid" || installment.amountPaid >= installment.amountDue) {
      return res.status(400).json({ message: "Installment is already paid" });
    }

    const pendingPayment = await Payment.findOne({ installmentId, paymentStatus: "pending" });
    if (pendingPayment) {
      return res.status(400).json({ message: "A payment for this installment is already pending review" });
    }

    const remaining = roundMoney(installment.amountDue - installment.amountPaid);
    if (amount <= 0 || amount > remaining) {
      return res.status(400).json({ message: `Payment amount must be between 1 and ${remaining}` });
    }

    const payment = await Payment.create({
      borrowerId: req.user._id,
      loanId: installment.loanId,
      installmentId,
      amount,
      paymentMethod,
      transactionId
    });

    await writeAudit(
      req.user,
      "payment_submitted",
      "Payment",
      payment._id,
      `Borrower submitted mock payment of ${amount} via ${paymentMethod} (TxID: ${transactionId})`
    );

    res.status(201).json(payment);
  })
);

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const payments = await Payment.find({ borrowerId: req.user._id })
      .populate("installmentId")
      .sort({ submittedAt: -1 });
    res.json(payments);
  })
);

router.get(
  "/pending",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const payments = await Payment.find({ paymentStatus: "pending" })
      .populate("borrowerId", "fullName phone")
      .populate("loanId")
      .populate("installmentId")
      .sort({ submittedAt: 1 });
    res.json(payments);
  })
);

router.patch(
  "/:id/approve",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Only pending payments can be approved" });
    }

    const installment = await Installment.findById(payment.installmentId);
    if (!installment) return res.status(404).json({ message: "Installment not found" });

    const remaining = roundMoney(installment.amountDue - installment.amountPaid);
    if (payment.amount > remaining) {
      return res.status(400).json({ message: "Payment amount exceeds remaining installment balance" });
    }

    payment.paymentStatus = "approved";
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    await payment.save();

    installment.amountPaid = roundMoney(installment.amountPaid + payment.amount);
    if (installment.amountPaid >= installment.amountDue) {
      installment.status = "paid";
      installment.paidAt = payment.approvedAt;
    } else {
      installment.status = "partial";
    }
    await installment.save();

    const receipt = await Receipt.create({
      receiptNumber: receiptNumber(),
      paymentId: payment._id,
      borrowerId: payment.borrowerId,
      loanId: payment.loanId,
      installmentId: payment.installmentId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      paymentDate: payment.approvedAt,
      approvedBy: req.user._id
    });

    const unpaidCount = await Installment.countDocuments({
      loanId: payment.loanId,
      status: { $ne: "paid" }
    });
    if (unpaidCount === 0) {
      await Loan.findByIdAndUpdate(payment.loanId, { loanStatus: "completed" });
    }

    await writeAudit(
      req.user,
      "payment_approved",
      "Payment",
      payment._id,
      `Approved payment ${payment.transactionId} and generated receipt ${receipt.receiptNumber}`
    );

    res.json({ payment, receipt });
  })
);

router.patch(
  "/:id/reject",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const { rejectionReason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Only pending payments can be rejected" });
    }

    payment.paymentStatus = "rejected";
    payment.rejectionReason = rejectionReason || "Payment rejected";
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    await payment.save();

    await writeAudit(
      req.user,
      "payment_rejected",
      "Payment",
      payment._id,
      `Rejected payment ${payment.transactionId}: ${payment.rejectionReason}`
    );

    res.json(payment);
  })
);

module.exports = router;

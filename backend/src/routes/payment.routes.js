const express = require("express");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const writeAudit = require("../utils/audit");
const { notifyUser, notifyUsers } = require("../utils/notify");
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

    const installment = await prisma.installment.findUnique({ where: { id: installmentId } });
    if (!installment || String(installment.borrowerId) !== String(req.user.id)) {
      return res.status(404).json({ message: "Installment not found" });
    }

    if (installment.status === "paid" || installment.amountPaid >= installment.amountDue) {
      return res.status(400).json({ message: "Installment is already paid" });
    }

    const pendingPayment = await prisma.payment.findFirst({
      where: { installmentId, paymentStatus: "pending" }
    });
    if (pendingPayment) {
      return res.status(400).json({ message: "A payment for this installment is already pending review" });
    }

    const remaining = roundMoney(installment.amountDue - installment.amountPaid);
    if (amount <= 0 || amount > remaining) {
      return res.status(400).json({ message: `Payment amount must be between 1 and ${remaining}` });
    }

    const payment = await prisma.payment.create({
      data: {
        borrowerId: req.user.id,
        loanId: installment.loanId,
        installmentId,
        amount,
        paymentMethod,
        transactionId
      }
    });

    await writeAudit(
      req.user,
      "payment_submitted",
      "Payment",
      payment.id,
      `Borrower submitted mock payment of ${amount} via ${paymentMethod} (TxID: ${transactionId})`
    );

    const reviewers = await prisma.user.findMany({
      where: { role: { in: ["admin", "supervisor"] }, status: "active" },
      select: { id: true }
    });
    await notifyUsers(reviewers.map((user) => user.id), {
      title: "Payment awaiting review",
      message: `${req.user.fullName} submitted ${amount} via ${paymentMethod}.`,
      type: "warning",
      link: "/dashboard?tab=payments"
    });

    res.status(201).json(payment);
  })
);

router.get(
  "/my",
  protect,
  authorize("borrower"),
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { borrowerId: req.user.id },
      include: { installment: true },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(payments);
  })
);

router.get(
  "/pending",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { paymentStatus: "pending" },
      include: {
        borrower: { select: { fullName: true, phone: true } },
        loan: true,
        installment: true
      },
      orderBy: { submittedAt: 'asc' }
    });
    res.json(payments);
  })
);

router.patch(
  "/:id/approve",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Only pending payments can be approved" });
    }

    let installment = await prisma.installment.findUnique({ where: { id: payment.installmentId } });
    if (!installment) return res.status(404).json({ message: "Installment not found" });

    const remaining = roundMoney(installment.amountDue - installment.amountPaid);
    if (payment.amount > remaining) {
      return res.status(400).json({ message: "Payment amount exceeds remaining installment balance" });
    }

    const approvedAt = new Date();
    const amountPaid = roundMoney(installment.amountPaid + payment.amount);
    let installmentStatus = "partial";
    let paidAt = null;

    if (amountPaid >= installment.amountDue) {
      installmentStatus = "paid";
      paidAt = approvedAt;
    }

    const [updatedPayment, updatedInstallment, receipt] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: "approved", approvedById: req.user.id, approvedAt }
      }),
      prisma.installment.update({
        where: { id: installment.id },
        data: { amountPaid, status: installmentStatus, paidAt }
      }),
      prisma.receipt.create({
        data: {
          receiptNumber: receiptNumber(),
          paymentId: payment.id,
          borrowerId: payment.borrowerId,
          loanId: payment.loanId,
          installmentId: payment.installmentId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId,
          paymentDate: approvedAt,
          approvedById: req.user.id
        }
      })
    ]);

    const unpaidCount = await prisma.installment.count({
      where: { loanId: payment.loanId, status: { not: "paid" } }
    });
    
    if (unpaidCount === 0) {
      await prisma.loan.update({
        where: { id: payment.loanId },
        data: { loanStatus: "completed" }
      });
    }

    await writeAudit(
      req.user,
      "payment_approved",
      "Payment",
      payment.id,
      `Approved payment ${payment.transactionId} and generated receipt ${receipt.receiptNumber}`
    );

    await notifyUser(payment.borrowerId, {
      title: "Payment approved",
      message: `Your payment ${payment.transactionId} was approved and receipt ${receipt.receiptNumber} is ready.`,
      type: "success",
      link: `/receipts/${receipt.id}`
    });

    res.json({ payment: updatedPayment, receipt });
  })
);

router.patch(
  "/:id/reject",
  protect,
  authorize("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const { rejectionReason } = req.body;
    let payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Only pending payments can be rejected" });
    }

    payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        paymentStatus: "rejected",
        rejectionReason: rejectionReason || "Payment rejected",
        approvedById: req.user.id,
        approvedAt: new Date()
      }
    });

    await writeAudit(
      req.user,
      "payment_rejected",
      "Payment",
      payment.id,
      `Rejected payment ${payment.transactionId}: ${payment.rejectionReason}`
    );

    await notifyUser(payment.borrowerId, {
      title: "Payment rejected",
      message: payment.rejectionReason,
      type: "danger",
      link: "/borrower"
    });

    res.json(payment);
  })
);

module.exports = router;

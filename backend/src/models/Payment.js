const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
    installmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Installment", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["bKash", "Nagad", "Rocket", "Card", "Cash Assist"],
      required: true
    },
    transactionId: { type: String, required: true, trim: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    submittedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    rejectionReason: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

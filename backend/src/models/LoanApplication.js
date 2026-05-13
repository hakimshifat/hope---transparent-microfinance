const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema(
  {
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    loanProductId: { type: mongoose.Schema.Types.ObjectId, ref: "LoanProduct", required: true },
    requestedAmount: { type: Number, required: true, min: 1 },
    purpose: { type: String, required: true, trim: true },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    rejectionReason: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoanApplication", loanApplicationSchema);

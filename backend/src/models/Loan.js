const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    loanProductId: { type: mongoose.Schema.Types.ObjectId, ref: "LoanProduct", required: true },
    principalAmount: { type: Number, required: true, min: 1 },
    serviceChargeAmount: { type: Number, required: true, min: 0 },
    totalPayableAmount: { type: Number, required: true, min: 1 },
    durationMonths: { type: Number, required: true, min: 1 },
    installmentFrequency: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true
    },
    numberOfInstallments: { type: Number, required: true, min: 1 },
    installmentAmount: { type: Number, required: true, min: 1 },
    disbursementDate: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    loanStatus: {
      type: String,
      enum: ["active", "completed", "defaulted"],
      default: "active"
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);

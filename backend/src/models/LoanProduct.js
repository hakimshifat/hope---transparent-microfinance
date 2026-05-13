const mongoose = require("mongoose");

const loanProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, required: true, min: 0 },
    serviceChargeRate: { type: Number, required: true, min: 0 },
    durationMonths: { type: Number, required: true, min: 1 },
    installmentFrequency: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true
    },
    numberOfInstallments: { type: Number, required: true, min: 1 },
    lateFeeAmount: { type: Number, default: 0, min: 0 },
    eligibilityNote: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoanProduct", loanProductSchema);

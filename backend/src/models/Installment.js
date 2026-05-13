const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema(
  {
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    installmentNumber: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["upcoming", "due", "paid", "overdue", "partial"],
      default: "upcoming"
    },
    paidAt: Date
  },
  { timestamps: true }
);

installmentSchema.index({ loanId: 1, installmentNumber: 1 }, { unique: true });
installmentSchema.index({ borrowerId: 1, dueDate: 1 });

module.exports = mongoose.model("Installment", installmentSchema);

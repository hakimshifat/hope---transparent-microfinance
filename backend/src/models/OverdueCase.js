const mongoose = require("mongoose");

const overdueCaseSchema = new mongoose.Schema(
  {
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
    installmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Installment" },
    assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    caseStatus: {
      type: String,
      enum: ["assigned", "visited", "follow_up_required", "resolved"],
      default: "assigned"
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal"
    },
    notes: { type: String, trim: true },
    assignedAt: { type: Date, default: Date.now },
    resolvedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("OverdueCase", overdueCaseSchema);

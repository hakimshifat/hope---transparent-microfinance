const mongoose = require("mongoose");

const visitLogSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "OverdueCase", required: true },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    visitDate: { type: Date, required: true },
    visitOutcome: { type: String, required: true, trim: true },
    borrowerResponse: { type: String, required: true, trim: true },
    nextFollowUpDate: Date,
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VisitLog", visitLogSchema);

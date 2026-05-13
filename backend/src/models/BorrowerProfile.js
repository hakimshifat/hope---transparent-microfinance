const mongoose = require("mongoose");

const borrowerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    occupation: { type: String, required: true, trim: true },
    monthlyIncome: { type: Number, required: true, min: 0 },
    nidNumber: { type: String, required: true, trim: true },
    nidImageUrl: { type: String, trim: true },
    nomineeName: { type: String, trim: true },
    nomineePhone: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },
    verificationNotes: { type: String, trim: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("BorrowerProfile", borrowerProfileSchema);

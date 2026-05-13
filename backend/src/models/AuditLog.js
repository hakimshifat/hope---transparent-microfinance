const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, required: true },
    actionType: { type: String, required: true, trim: true },
    targetType: { type: String, required: true, trim: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    description: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);

const AuditLog = require("../models/AuditLog");

async function writeAudit(actor, actionType, targetType, targetId, description) {
  if (!actor || !targetId) return null;

  return AuditLog.create({
    actorId: actor._id,
    actorRole: actor.role,
    actionType,
    targetType,
    targetId,
    description
  });
}

module.exports = writeAudit;

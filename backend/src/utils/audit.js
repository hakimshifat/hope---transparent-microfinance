const prisma = require("../config/prisma");

async function writeAudit(actor, actionType, targetType, targetId, description) {
  if (!actor || !targetId) return null;

  return prisma.auditLog.create({
    data: {
      actorId: actor.id || actor._id,
      actorRole: actor.role,
      actionType,
      targetType,
      targetId: String(targetId),
      description
    }
  });
}

module.exports = writeAudit;

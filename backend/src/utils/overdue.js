const prisma = require("../config/prisma");

async function refreshOverdueInstallments() {
  const now = new Date();

  // Prisma updateMany cannot compare two columns (amountPaid < amountDue),
  // so we fetch candidates first then batch-update their IDs.
  const candidates = await prisma.installment.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["upcoming", "due", "partial"] }
    },
    select: { id: true, amountDue: true, amountPaid: true }
  });

  const overdueIds = candidates
    .filter((i) => i.amountPaid < i.amountDue)
    .map((i) => i.id);

  if (overdueIds.length === 0) return 0;

  const result = await prisma.installment.updateMany({
    where: { id: { in: overdueIds } },
    data: { status: "overdue" }
  });

  return result.count;
}

module.exports = { refreshOverdueInstallments };

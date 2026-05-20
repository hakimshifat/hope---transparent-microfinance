const prisma = require("../config/prisma");

async function refreshOverdueInstallments() {
  const now = new Date();
  
  const result = await prisma.installment.updateMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["upcoming", "due", "partial", "overdue"] },
      amountPaid: { lt: prisma.installment.fields.amountDue }
    },
    data: {
      status: "overdue"
    }
  });

  return result.count;
}

module.exports = { refreshOverdueInstallments };

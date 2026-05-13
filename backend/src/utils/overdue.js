const Installment = require("../models/Installment");

async function refreshOverdueInstallments() {
  const now = new Date();
  const candidates = await Installment.find({
    dueDate: { $lt: now },
    status: { $in: ["upcoming", "due", "partial", "overdue"] }
  });

  const updates = candidates
    .filter((installment) => installment.amountPaid < installment.amountDue)
    .map((installment) => {
      installment.status = "overdue";
      return installment.save();
    });

  await Promise.all(updates);
  return updates.length;
}

module.exports = { refreshOverdueInstallments };

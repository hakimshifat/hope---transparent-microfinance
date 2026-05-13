function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function addFrequency(date, frequency, count) {
  const next = new Date(date);

  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7 * count);
  } else {
    next.setMonth(next.getMonth() + count);
  }

  return next;
}

function buildLoanData({ borrowerId, product, principalAmount, approvedBy, disbursementDate = new Date() }) {
  const serviceChargeAmount = roundMoney((principalAmount * product.serviceChargeRate) / 100);
  const totalPayableAmount = roundMoney(principalAmount + serviceChargeAmount);
  const installmentAmount = roundMoney(totalPayableAmount / product.numberOfInstallments);
  const startDate = addFrequency(disbursementDate, product.installmentFrequency, 1);
  const endDate = addFrequency(disbursementDate, product.installmentFrequency, product.numberOfInstallments);

  return {
    borrowerId,
    loanProductId: product._id,
    principalAmount,
    serviceChargeAmount,
    totalPayableAmount,
    durationMonths: product.durationMonths,
    installmentFrequency: product.installmentFrequency,
    numberOfInstallments: product.numberOfInstallments,
    installmentAmount,
    disbursementDate,
    startDate,
    endDate,
    loanStatus: "active",
    approvedBy
  };
}

function buildInstallmentSchedule(loan) {
  const installments = [];
  let allocated = 0;

  for (let index = 1; index <= loan.numberOfInstallments; index += 1) {
    const isLast = index === loan.numberOfInstallments;
    const amountDue = isLast
      ? roundMoney(loan.totalPayableAmount - allocated)
      : loan.installmentAmount;

    allocated = roundMoney(allocated + amountDue);

    installments.push({
      loanId: loan._id,
      borrowerId: loan.borrowerId,
      installmentNumber: index,
      dueDate: addFrequency(loan.disbursementDate, loan.installmentFrequency, index),
      amountDue,
      amountPaid: 0,
      status: "upcoming"
    });
  }

  return installments;
}

module.exports = { roundMoney, addFrequency, buildLoanData, buildInstallmentSchedule };

require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { buildLoanData, buildInstallmentSchedule } = require("../utils/loanCalculator");

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysAhead(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function receiptNo(n) { return `HOPE-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`; }

async function clearDatabase() {
  // Delete in dependency order
  const tables = [
    "visitLog", "auditLog", "receipt", "payment", "overdueCase",
    "installment", "loan", "loanApplication", "loanProduct",
    "borrowerProfile", "notification", "user"
  ];
  for (const t of tables) await prisma[t].deleteMany({});
  console.log("Database cleared.");
}

async function hashPw(pw) { return bcrypt.hash(pw, 10); }

async function seed() {
  await prisma.$connect();
  await clearDatabase();

  const pw = {
    admin: await hashPw("Admin123!"),
    officer: await hashPw("Officer123!"),
    borrower: await hashPw("Borrower123!")
  };

  // ─── Users ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({ data: { fullName: "Md. Tariqul Islam", phone: "01711000001", email: "admin@hope.bd", password: pw.admin, role: "admin", status: "active" } });
  const supervisor = await prisma.user.create({ data: { fullName: "Mst. Nusrat Jahan", phone: "01711000002", email: "supervisor@hope.bd", password: pw.admin, role: "supervisor", status: "active" } });
  const officerRahim = await prisma.user.create({ data: { fullName: "Md. Rahim Uddin", phone: "01711000003", email: "rahim.fo@hope.bd", password: pw.officer, role: "field_officer", status: "active" } });
  const officerKamal = await prisma.user.create({ data: { fullName: "Md. Kamal Hossain", phone: "01711000004", email: "kamal.fo@hope.bd", password: pw.officer, role: "field_officer", status: "active" } });
  const bAyesha = await prisma.user.create({ data: { fullName: "Ayesha Begum", phone: "01812345101", email: "ayesha@hope.bd", password: pw.borrower, role: "borrower", status: "active" } });
  const bMizan = await prisma.user.create({ data: { fullName: "Md. Mizanur Rahman", phone: "01812345102", email: "mizan@hope.bd", password: pw.borrower, role: "borrower", status: "active" } });
  const bSharmin = await prisma.user.create({ data: { fullName: "Sharmin Akter", phone: "01812345103", email: "sharmin@hope.bd", password: pw.borrower, role: "borrower", status: "active" } });
  const bJamal = await prisma.user.create({ data: { fullName: "Md. Jamal Uddin", phone: "01812345104", email: "jamal@hope.bd", password: pw.borrower, role: "borrower", status: "active" } });
  const bRashida = await prisma.user.create({ data: { fullName: "Rashida Khanam", phone: "01812345105", email: "rashida@hope.bd", password: pw.borrower, role: "borrower", status: "active" } });
  const bKobir = await prisma.user.create({ data: { fullName: "Md. Kobir Ahmed", phone: "01812345106", email: "kobir@hope.bd", password: pw.borrower, role: "borrower", status: "active" } });

  // ─── Borrower Profiles ──────────────────────────────────────────────────
  const profiles = [
    { userId: bAyesha.id, fullName: bAyesha.fullName, phone: bAyesha.phone, address: "Bari No. 12, Mohammadpur, Dhaka-1207", occupation: "মুদি দোকান মালিক (Grocery shop owner)", monthlyIncome: 28000, nidNumber: "1990123456789", nomineeName: "Md. Rafiqul Islam", nomineePhone: "01912345201", verificationStatus: "verified", verifiedById: admin.id, verifiedAt: daysAgo(40) },
    { userId: bMizan.id, fullName: bMizan.fullName, phone: bMizan.phone, address: "Ward No. 5, Savar Bazar, Savar, Dhaka", occupation: "দর্জি (Tailor – garments alteration)", monthlyIncome: 22000, nidNumber: "1988234567890", nomineeName: "Mst. Tania Begum", nomineePhone: "01912345202", verificationStatus: "verified", verifiedById: supervisor.id, verifiedAt: daysAgo(30) },
    { userId: bSharmin.id, fullName: bSharmin.fullName, phone: bSharmin.phone, address: "Holding No. 88, Gazipur Sadar, Gazipur", occupation: "হাঁস-মুরগির খামার (Poultry farm worker)", monthlyIncome: 18000, nidNumber: "1995345678901", nomineeName: "Md. Hasan Ali", nomineePhone: "01912345203", verificationStatus: "verified", verifiedById: supervisor.id, verifiedAt: daysAgo(20) },
    { userId: bJamal.id, fullName: bJamal.fullName, phone: bJamal.phone, address: "Para: Purbo Narayanganj, Narayanganj Sadar", occupation: "রিকশা চালক (Rickshaw puller)", monthlyIncome: 15000, nidNumber: "1982456789012", nomineeName: "Mst. Kulsum Begum", nomineePhone: "01912345204", verificationStatus: "pending" },
    { userId: bRashida.id, fullName: bRashida.fullName, phone: bRashida.phone, address: "Vill: Char Bhairabi, Bhola Sadar, Bhola", occupation: "নকশিকাঁথা শিল্পী (Nakshi Kantha artisan)", monthlyIncome: 12000, nidNumber: "1998567890123", nomineeName: "Md. Jalal Uddin", nomineePhone: "01912345205", verificationStatus: "pending" },
    { userId: bKobir.id, fullName: bKobir.fullName, phone: bKobir.phone, address: "Road No. 3, Block B, Mirpur-11, Dhaka-1216", occupation: "মোবাইল সার্ভিসিং (Mobile phone repair technician)", monthlyIncome: 25000, nidNumber: "1993678901234", nomineeName: "Mst. Sultana Begum", nomineePhone: "01912345206", verificationStatus: "rejected", verificationNotes: "NID number does not match provided copy. Resubmission requested.", verifiedById: admin.id, verifiedAt: daysAgo(5) },
  ];
  for (const p of profiles) await prisma.borrowerProfile.create({ data: p });

  // ─── Loan Products ──────────────────────────────────────────────────────
  const prodStarter = await prisma.loanProduct.create({ data: { productName: "ক্ষুদ্র ব্যবসা সহায়তা (Small Business Starter)", description: "Small shops, tea stalls, and service businesses. Quick short-term working capital up to ৳50,000 with weekly repayments.", minAmount: 10000, maxAmount: 50000, serviceChargeRate: 10, durationMonths: 3, installmentFrequency: "weekly", numberOfInstallments: 12, lateFeeAmount: 100, eligibilityNote: "Verified borrower with regular income. Business must be operating.", status: "active" } });
  const prodWomen = await prisma.loanProduct.create({ data: { productName: "নারী উদ্যোক্তা ঋণ (Women Entrepreneur Loan)", description: "For women-led home and retail businesses including tailoring, handicrafts, poultry, and small trading.", minAmount: 15000, maxAmount: 80000, serviceChargeRate: 9, durationMonths: 6, installmentFrequency: "monthly", numberOfInstallments: 6, lateFeeAmount: 150, eligibilityNote: "Female borrower with a business plan. Verified profile required.", status: "active" } });
  const prodAgri = await prisma.loanProduct.create({ data: { productName: "কৃষি সহায়তা ঋণ (Agriculture Support Loan)", description: "Seasonal input financing for farming, fishery, and poultry. Repayment aligned with harvest cycles.", minAmount: 8000, maxAmount: 40000, serviceChargeRate: 8, durationMonths: 4, installmentFrequency: "monthly", numberOfInstallments: 4, lateFeeAmount: 120, eligibilityNote: "Borrower must have agricultural or livestock-based income.", status: "active" } });
  const prodEmergency = await prisma.loanProduct.create({ data: { productName: "জরুরি পারিবারিক ঋণ (Emergency Family Loan)", description: "Quick-release emergency support for medical, housing repair, or family crisis situations.", minAmount: 5000, maxAmount: 25000, serviceChargeRate: 12, durationMonths: 2, installmentFrequency: "weekly", numberOfInstallments: 8, lateFeeAmount: 80, eligibilityNote: "Verified borrower only. Purpose must be documented.", status: "active" } });

  // ─── Loan Applications ──────────────────────────────────────────────────
  const appAyesha = await prisma.loanApplication.create({ data: { borrowerId: bAyesha.id, loanProductId: prodStarter.id, requestedAmount: 24000, purpose: "Eid season inventory for grocery shop – need to stock rice, oil, lentils before peak demand", applicationStatus: "approved", reviewedById: supervisor.id, reviewedAt: daysAgo(38) } });
  const appMizan = await prisma.loanApplication.create({ data: { borrowerId: bMizan.id, loanProductId: prodWomen.id, requestedAmount: 30000, purpose: "Purchase industrial sewing machine and three months of fabric stock", applicationStatus: "approved", reviewedById: supervisor.id, reviewedAt: daysAgo(70) } });
  const appSharmin = await prisma.loanApplication.create({ data: { borrowerId: bSharmin.id, loanProductId: prodAgri.id, requestedAmount: 20000, purpose: "Buy 500 broiler chicks and feed for the season", applicationStatus: "approved", reviewedById: admin.id, reviewedAt: daysAgo(95) } });
  await prisma.loanApplication.create({ data: { borrowerId: bJamal.id, loanProductId: prodEmergency.id, requestedAmount: 15000, purpose: "Medical treatment for wife at Dhaka Medical College Hospital", applicationStatus: "pending" } });
  await prisma.loanApplication.create({ data: { borrowerId: bRashida.id, loanProductId: prodWomen.id, requestedAmount: 18000, purpose: "Buy raw materials (thread, fabric) for nakshi kantha production before Baishakh fair", applicationStatus: "pending" } });

  // ─── Loans + Installments ───────────────────────────────────────────────
  async function createLoan(borrowerId, product, principalAmount, approvedById, disbursementDate) {
    const loanData = buildLoanData({ borrowerId, product, principalAmount, approvedBy: approvedById, disbursementDate });
    const loan = await prisma.loan.create({ data: loanData });
    const schedule = buildInstallmentSchedule(loan).map((i) => ({ ...i, dueDate: new Date(i.dueDate) }));
    await prisma.installment.createMany({ data: schedule });
    const installments = await prisma.installment.findMany({ where: { loanId: loan.id }, orderBy: { installmentNumber: "asc" } });
    return { loan, installments };
  }

  const { loan: loanAyesha, installments: schedAyesha } = await createLoan(bAyesha.id, prodStarter, 24000, supervisor.id, daysAgo(35));
  const { loan: loanMizan, installments: schedMizan } = await createLoan(bMizan.id, prodWomen, 30000, supervisor.id, daysAgo(75));
  const { loan: loanSharmin, installments: schedSharmin } = await createLoan(bSharmin.id, prodAgri, 20000, admin.id, daysAgo(100));

  // ─── Payments + Receipts helper ─────────────────────────────────────────
  let receiptCounter = 1;
  async function payInstallment(borrowerId, loan, inst, method, txPrefix, approvedById, paidAt) {
    const payment = await prisma.payment.create({ data: { borrowerId, loanId: loan.id, installmentId: inst.id, amount: inst.amountDue, paymentMethod: method, transactionId: `${txPrefix}-${receiptCounter}`, paymentStatus: "approved", submittedAt: paidAt, approvedById, approvedAt: paidAt } });
    await prisma.installment.update({ where: { id: inst.id }, data: { amountPaid: inst.amountDue, status: "paid", paidAt } });
    await prisma.receipt.create({ data: { receiptNumber: receiptNo(receiptCounter++), paymentId: payment.id, borrowerId, loanId: loan.id, installmentId: inst.id, amount: payment.amount, paymentMethod: method, transactionId: payment.transactionId, paymentDate: paidAt, approvedById } });
  }

  // Ayesha: 4 installments paid
  for (let i = 0; i < 4; i++) {
    const paidAt = new Date(loanAyesha.disbursementDate.getTime() + (i + 1) * 7 * 86400000);
    await payInstallment(bAyesha.id, loanAyesha, schedAyesha[i], i % 2 === 0 ? "bKash" : "Nagad", "BK-AY", supervisor.id, paidAt);
  }
  // 5th installment: pending payment
  await prisma.payment.create({ data: { borrowerId: bAyesha.id, loanId: loanAyesha.id, installmentId: schedAyesha[4].id, amount: schedAyesha[4].amountDue, paymentMethod: "bKash", transactionId: "BK-AY-PENDING-99", paymentStatus: "pending", submittedAt: daysAgo(1) } });

  // Mizan: 2 monthly installments paid
  for (let i = 0; i < 2; i++) {
    const paidAt = new Date(loanMizan.disbursementDate.getTime() + (i + 1) * 30 * 86400000);
    await payInstallment(bMizan.id, loanMizan, schedMizan[i], "Rocket", "RKT-MZ", admin.id, paidAt);
  }

  // Sharmin: only 1st paid
  {
    const paidAt = new Date(loanSharmin.disbursementDate.getTime() + 30 * 86400000);
    await payInstallment(bSharmin.id, loanSharmin, schedSharmin[0], "bKash", "BK-SH", supervisor.id, paidAt);
  }

  // ─── Overdue refresh ────────────────────────────────────────────────────
  const { refreshOverdueInstallments } = require("../utils/overdue");
  await refreshOverdueInstallments();

  // ─── Overdue Cases ──────────────────────────────────────────────────────
  const caseOne = await prisma.overdueCase.create({ data: { borrowerId: bSharmin.id, loanId: loanSharmin.id, installmentId: schedSharmin[1].id, assignedOfficerId: officerRahim.id, caseStatus: "visited", priority: "urgent", notes: "Borrower says poultry market is down due to bird flu scare. Follow up weekly." } });
  const caseTwo = await prisma.overdueCase.create({ data: { borrowerId: bSharmin.id, loanId: loanSharmin.id, installmentId: schedSharmin[2].id, assignedOfficerId: officerKamal.id, caseStatus: "assigned", priority: "normal", notes: "Second overdue installment. Coordinate with Rahim for joint visit." } });

  // ─── Visit Logs ─────────────────────────────────────────────────────────
  await prisma.visitLog.createMany({ data: [
    { caseId: caseOne.id, officerId: officerRahim.id, visitDate: daysAgo(10), visitOutcome: "Borrower met in person at farm site", borrowerResponse: "Stated that bird flu scare reduced chicken prices by 40%. Cannot pay this month but committed to pay next month.", nextFollowUpDate: daysAhead(5), notes: "Borrower was cooperative. Farm appears active. Recommends grace period." },
    { caseId: caseOne.id, officerId: officerRahim.id, visitDate: daysAgo(3), visitOutcome: "Follow-up phone call", borrowerResponse: "Will submit partial payment of ৳2,500 via bKash by Sunday.", nextFollowUpDate: daysAhead(4), notes: "Partial payment agreed. Update case to follow_up_required." },
  ] });

  // ─── Audit Logs ─────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({ data: [
    { actorId: admin.id, actorRole: "admin", actionType: "loan_product_created", targetType: "LoanProduct", targetId: prodStarter.id, description: "Created loan product: Small Business Starter" },
    { actorId: admin.id, actorRole: "admin", actionType: "loan_product_created", targetType: "LoanProduct", targetId: prodWomen.id, description: "Created loan product: Women Entrepreneur Loan" },
    { actorId: admin.id, actorRole: "admin", actionType: "loan_product_created", targetType: "LoanProduct", targetId: prodAgri.id, description: "Created loan product: Agriculture Support Loan" },
    { actorId: admin.id, actorRole: "admin", actionType: "loan_product_created", targetType: "LoanProduct", targetId: prodEmergency.id, description: "Created loan product: Emergency Family Loan" },
    { actorId: admin.id, actorRole: "admin", actionType: "borrower_verified", targetType: "BorrowerProfile", targetId: bAyesha.id, description: "Verified Ayesha Begum's borrower profile" },
    { actorId: supervisor.id, actorRole: "supervisor", actionType: "borrower_verified", targetType: "BorrowerProfile", targetId: bMizan.id, description: "Verified Md. Mizanur Rahman's borrower profile" },
    { actorId: supervisor.id, actorRole: "supervisor", actionType: "borrower_verified", targetType: "BorrowerProfile", targetId: bSharmin.id, description: "Verified Sharmin Akter's borrower profile" },
    { actorId: admin.id, actorRole: "admin", actionType: "borrower_rejected", targetType: "BorrowerProfile", targetId: bKobir.id, description: "Rejected Md. Kobir Ahmed — NID mismatch" },
    { actorId: supervisor.id, actorRole: "supervisor", actionType: "loan_application_approved", targetType: "LoanApplication", targetId: appAyesha.id, description: "Approved Ayesha Begum loan application ৳24,000" },
    { actorId: supervisor.id, actorRole: "supervisor", actionType: "loan_application_approved", targetType: "LoanApplication", targetId: appMizan.id, description: "Approved Mizanur Rahman loan application ৳30,000" },
    { actorId: admin.id, actorRole: "admin", actionType: "loan_application_approved", targetType: "LoanApplication", targetId: appSharmin.id, description: "Approved Sharmin Akter agri loan ৳20,000" },
    { actorId: admin.id, actorRole: "admin", actionType: "overdue_case_assigned", targetType: "OverdueCase", targetId: caseOne.id, description: `Overdue case assigned to ${officerRahim.fullName}` },
    { actorId: admin.id, actorRole: "admin", actionType: "overdue_case_assigned", targetType: "OverdueCase", targetId: caseTwo.id, description: `Overdue case assigned to ${officerKamal.fullName}` },
  ] });

  // ─── Notifications ──────────────────────────────────────────────────────
  await prisma.notification.createMany({ data: [
    { userId: bAyesha.id, title: "Profile verified", message: "Your borrower profile has been verified. You can apply for eligible loan products.", type: "success", link: "/profile" },
    { userId: bAyesha.id, title: "Loan approved", message: "Your loan application for ৳24,000 has been approved and disbursed.", type: "success", link: "/borrower" },
    { userId: bSharmin.id, title: "Overdue follow-up opened", message: "A field officer has been assigned to follow up on your overdue installment.", type: "warning", link: "/borrower" },
    { userId: officerRahim.id, title: "New overdue case assigned", message: "An urgent priority case was assigned to you.", type: "danger", link: "/field/cases" },
    { userId: officerKamal.id, title: "New overdue case assigned", message: "A normal priority case was assigned to you.", type: "warning", link: "/field/cases" },
    { userId: admin.id, title: "Payment awaiting review", message: "Ayesha Begum submitted ৳2,200 via bKash.", type: "warning", link: "/dashboard?tab=payments" },
    { userId: supervisor.id, title: "Payment awaiting review", message: "Ayesha Begum submitted ৳2,200 via bKash.", type: "warning", link: "/dashboard?tab=payments" },
  ] });

  console.log("\n✅ Database seeded successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ADMIN        : admin@hope.bd         / Admin123!");
  console.log("SUPERVISOR   : supervisor@hope.bd    / Admin123!");
  console.log("FIELD OFFICER: rahim.fo@hope.bd      / Officer123!");
  console.log("FIELD OFFICER: kamal.fo@hope.bd      / Officer123!");
  console.log("BORROWER     : ayesha@hope.bd         / Borrower123! (active loan, pending payment)");
  console.log("BORROWER     : mizan@hope.bd          / Borrower123! (active loan, 2 paid)");
  console.log("BORROWER     : sharmin@hope.bd        / Borrower123! (active loan, OVERDUE)");
  console.log("BORROWER     : jamal@hope.bd          / Borrower123! (pending application)");
  console.log("BORROWER     : rashida@hope.bd        / Borrower123! (pending application)");
  console.log("BORROWER     : kobir@hope.bd          / Borrower123! (profile rejected)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

seed()
  .catch((error) => { console.error("Seed failed:", error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });

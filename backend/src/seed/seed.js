require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const AuditLog = require("../models/AuditLog");
const BorrowerProfile = require("../models/BorrowerProfile");
const Installment = require("../models/Installment");
const Loan = require("../models/Loan");
const LoanApplication = require("../models/LoanApplication");
const LoanProduct = require("../models/LoanProduct");
const Notification = require("../models/Notification");
const OverdueCase = require("../models/OverdueCase");
const Payment = require("../models/Payment");
const Receipt = require("../models/Receipt");
const User = require("../models/User");
const VisitLog = require("../models/VisitLog");
const { buildLoanData, buildInstallmentSchedule } = require("../utils/loanCalculator");
const { refreshOverdueInstallments } = require("../utils/overdue");

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysAhead(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function receiptNo(n) { return `HOPE-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`; }

async function clearDatabase() {
  await Promise.all([
    AuditLog.deleteMany({}),
    BorrowerProfile.deleteMany({}),
    Installment.deleteMany({}),
    Loan.deleteMany({}),
    LoanApplication.deleteMany({}),
    LoanProduct.deleteMany({}),
    Notification.deleteMany({}),
    OverdueCase.deleteMany({}),
    Payment.deleteMany({}),
    Receipt.deleteMany({}),
    User.deleteMany({}),
    VisitLog.deleteMany({})
  ]);
  console.log("Database cleared.");
}

async function seed() {
  await connectDB();
  await clearDatabase();

  // ─── Users ───────────────────────────────────────────────────────────────
  const [
    admin, supervisor,
    officerRahim, officerKamal,
    bAyesha, bMizan, bSharmin, bJamal, bRashida, bKobir
  ] = await User.create([
    { fullName: "Md. Tariqul Islam",   phone: "01711000001", email: "admin@hope.bd",        password: "Admin123!",    role: "admin",        status: "active" },
    { fullName: "Mst. Nusrat Jahan",   phone: "01711000002", email: "supervisor@hope.bd",   password: "Admin123!",    role: "supervisor",   status: "active" },
    { fullName: "Md. Rahim Uddin",     phone: "01711000003", email: "rahim.fo@hope.bd",     password: "Officer123!",  role: "field_officer",status: "active" },
    { fullName: "Md. Kamal Hossain",   phone: "01711000004", email: "kamal.fo@hope.bd",     password: "Officer123!",  role: "field_officer",status: "active" },
    { fullName: "Ayesha Begum",        phone: "01812345101", email: "ayesha@hope.bd",        password: "Borrower123!", role: "borrower",     status: "active" },
    { fullName: "Md. Mizanur Rahman",  phone: "01812345102", email: "mizan@hope.bd",         password: "Borrower123!", role: "borrower",     status: "active" },
    { fullName: "Sharmin Akter",       phone: "01812345103", email: "sharmin@hope.bd",       password: "Borrower123!", role: "borrower",     status: "active" },
    { fullName: "Md. Jamal Uddin",     phone: "01812345104", email: "jamal@hope.bd",         password: "Borrower123!", role: "borrower",     status: "active" },
    { fullName: "Rashida Khanam",      phone: "01812345105", email: "rashida@hope.bd",       password: "Borrower123!", role: "borrower",     status: "active" },
    { fullName: "Md. Kobir Ahmed",     phone: "01812345106", email: "kobir@hope.bd",         password: "Borrower123!", role: "borrower",     status: "active" }
  ]);

  // ─── Borrower Profiles ───────────────────────────────────────────────────
  await BorrowerProfile.create([
    {
      userId: bAyesha._id, fullName: bAyesha.fullName, phone: bAyesha.phone,
      address: "Bari No. 12, Mohammadpur, Dhaka-1207",
      occupation: "মুদি দোকান মালিক (Grocery shop owner)",
      monthlyIncome: 28000, nidNumber: "1990123456789",
      nomineeName: "Md. Rafiqul Islam", nomineePhone: "01912345201",
      verificationStatus: "verified", verifiedBy: admin._id, verifiedAt: daysAgo(40)
    },
    {
      userId: bMizan._id, fullName: bMizan.fullName, phone: bMizan.phone,
      address: "Ward No. 5, Savar Bazar, Savar, Dhaka",
      occupation: "দর্জি (Tailor – garments alteration)",
      monthlyIncome: 22000, nidNumber: "1988234567890",
      nomineeName: "Mst. Tania Begum", nomineePhone: "01912345202",
      verificationStatus: "verified", verifiedBy: supervisor._id, verifiedAt: daysAgo(30)
    },
    {
      userId: bSharmin._id, fullName: bSharmin.fullName, phone: bSharmin.phone,
      address: "Holding No. 88, Gazipur Sadar, Gazipur",
      occupation: "হাঁস-মুরগির খামার (Poultry farm worker)",
      monthlyIncome: 18000, nidNumber: "1995345678901",
      nomineeName: "Md. Hasan Ali", nomineePhone: "01912345203",
      verificationStatus: "verified", verifiedBy: supervisor._id, verifiedAt: daysAgo(20)
    },
    {
      userId: bJamal._id, fullName: bJamal.fullName, phone: bJamal.phone,
      address: "Para: Purbo Narayanganj, Narayanganj Sadar",
      occupation: "রিকশা চালক (Rickshaw puller)",
      monthlyIncome: 15000, nidNumber: "1982456789012",
      nomineeName: "Mst. Kulsum Begum", nomineePhone: "01912345204",
      verificationStatus: "pending"
    },
    {
      userId: bRashida._id, fullName: bRashida.fullName, phone: bRashida.phone,
      address: "Vill: Char Bhairabi, Bhola Sadar, Bhola",
      occupation: "নকশিকাঁথা শিল্পী (Nakshi Kantha artisan)",
      monthlyIncome: 12000, nidNumber: "1998567890123",
      nomineeName: "Md. Jalal Uddin", nomineePhone: "01912345205",
      verificationStatus: "pending"
    },
    {
      userId: bKobir._id, fullName: bKobir.fullName, phone: bKobir.phone,
      address: "Road No. 3, Block B, Mirpur-11, Dhaka-1216",
      occupation: "মোবাইল সার্ভিসিং (Mobile phone repair technician)",
      monthlyIncome: 25000, nidNumber: "1993678901234",
      nomineeName: "Mst. Sultana Begum", nomineePhone: "01912345206",
      verificationStatus: "rejected",
      verificationNotes: "NID number does not match provided copy. Resubmission requested.",
      verifiedBy: admin._id, verifiedAt: daysAgo(5)
    }
  ]);

  // ─── Loan Products ────────────────────────────────────────────────────────
  const [prodStarter, prodWomen, prodAgri, prodEmergency] = await LoanProduct.create([
    {
      productName: "ক্ষুদ্র ব্যবসা সহায়তা (Small Business Starter)",
      description: "Small shops, tea stalls, and service businesses. Quick short-term working capital up to ৳50,000 with weekly repayments.",
      minAmount: 10000, maxAmount: 50000,
      serviceChargeRate: 10, durationMonths: 3,
      installmentFrequency: "weekly", numberOfInstallments: 12,
      lateFeeAmount: 100,
      eligibilityNote: "Verified borrower with regular income. Business must be operating.",
      status: "active"
    },
    {
      productName: "নারী উদ্যোক্তা ঋণ (Women Entrepreneur Loan)",
      description: "For women-led home and retail businesses including tailoring, handicrafts, poultry, and small trading.",
      minAmount: 15000, maxAmount: 80000,
      serviceChargeRate: 9, durationMonths: 6,
      installmentFrequency: "monthly", numberOfInstallments: 6,
      lateFeeAmount: 150,
      eligibilityNote: "Female borrower with a business plan. Verified profile required.",
      status: "active"
    },
    {
      productName: "কৃষি সহায়তা ঋণ (Agriculture Support Loan)",
      description: "Seasonal input financing for farming, fishery, and poultry. Repayment aligned with harvest cycles.",
      minAmount: 8000, maxAmount: 40000,
      serviceChargeRate: 8, durationMonths: 4,
      installmentFrequency: "monthly", numberOfInstallments: 4,
      lateFeeAmount: 120,
      eligibilityNote: "Borrower must have agricultural or livestock-based income.",
      status: "active"
    },
    {
      productName: "জরুরি পারিবারিক ঋণ (Emergency Family Loan)",
      description: "Quick-release emergency support for medical, housing repair, or family crisis situations.",
      minAmount: 5000, maxAmount: 25000,
      serviceChargeRate: 12, durationMonths: 2,
      installmentFrequency: "weekly", numberOfInstallments: 8,
      lateFeeAmount: 80,
      eligibilityNote: "Verified borrower only. Purpose must be documented.",
      status: "active"
    }
  ]);

  // ─── Loan Applications ────────────────────────────────────────────────────

  // Ayesha: approved, disbursed loan
  const appAyesha = await LoanApplication.create({
    borrowerId: bAyesha._id, loanProductId: prodStarter._id,
    requestedAmount: 24000,
    purpose: "Eid season inventory for grocery shop – need to stock rice, oil, lentils before peak demand",
    applicationStatus: "approved",
    reviewedBy: supervisor._id, reviewedAt: daysAgo(38)
  });

  // Mizan: approved, disbursed loan (monthly repayment with 2 paid)
  const appMizan = await LoanApplication.create({
    borrowerId: bMizan._id, loanProductId: prodWomen._id,
    requestedAmount: 30000,
    purpose: "Purchase industrial sewing machine and three months of fabric stock",
    applicationStatus: "approved",
    reviewedBy: supervisor._id, reviewedAt: daysAgo(70)
  });

  // Sharmin: approved, disbursed agri loan (overdue situation)
  const appSharmin = await LoanApplication.create({
    borrowerId: bSharmin._id, loanProductId: prodAgri._id,
    requestedAmount: 20000,
    purpose: "Buy 500 broiler chicks and feed for the season",
    applicationStatus: "approved",
    reviewedBy: admin._id, reviewedAt: daysAgo(95)
  });

  // Jamal: pending application
  await LoanApplication.create({
    borrowerId: bJamal._id, loanProductId: prodEmergency._id,
    requestedAmount: 15000,
    purpose: "Medical treatment for wife at Dhaka Medical College Hospital",
    applicationStatus: "pending"
  });

  // Rashida: pending application
  await LoanApplication.create({
    borrowerId: bRashida._id, loanProductId: prodWomen._id,
    requestedAmount: 18000,
    purpose: "Buy raw materials (thread, fabric) for nakshi kantha production before Baishakh fair",
    applicationStatus: "pending"
  });

  // ─── Loans ───────────────────────────────────────────────────────────────

  // Ayesha loan: active, started 35 days ago (weekly, 12 installments)
  const loanAyesha = await Loan.create(buildLoanData({
    borrowerId: bAyesha._id, product: prodStarter,
    principalAmount: 24000, approvedBy: supervisor._id,
    disbursementDate: daysAgo(35)
  }));
  const schedAyesha = await Installment.insertMany(buildInstallmentSchedule(loanAyesha));

  // Ayesha: 4 installments paid, 1 pending payment submitted
  let receiptCounter = 1;
  for (let i = 0; i < 4; i++) {
    const inst = schedAyesha[i];
    const paidAt = new Date(loanAyesha.disbursementDate.getTime() + (i + 1) * 7 * 86400000);
    const payment = await Payment.create({
      borrowerId: bAyesha._id, loanId: loanAyesha._id, installmentId: inst._id,
      amount: inst.amountDue, paymentMethod: i % 2 === 0 ? "bKash" : "Nagad",
      transactionId: `BK-AY-${2025001 + i}`, paymentStatus: "approved",
      submittedAt: paidAt, approvedBy: supervisor._id, approvedAt: paidAt
    });
    inst.amountPaid = inst.amountDue; inst.status = "paid"; inst.paidAt = paidAt;
    await inst.save();
    await Receipt.create({
      receiptNumber: receiptNo(receiptCounter++),
      paymentId: payment._id, borrowerId: bAyesha._id,
      loanId: loanAyesha._id, installmentId: inst._id,
      amount: payment.amount, paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId, paymentDate: paidAt,
      approvedBy: supervisor._id
    });
  }
  // 5th installment: pending payment submitted by borrower
  await Payment.create({
    borrowerId: bAyesha._id, loanId: loanAyesha._id, installmentId: schedAyesha[4]._id,
    amount: schedAyesha[4].amountDue, paymentMethod: "bKash",
    transactionId: "BK-AY-PENDING-99", paymentStatus: "pending",
    submittedAt: daysAgo(1)
  });

  // Mizan loan: active, started 75 days ago (monthly, 6 installments)
  const loanMizan = await Loan.create(buildLoanData({
    borrowerId: bMizan._id, product: prodWomen._id ? prodWomen : prodStarter,
    principalAmount: 30000, approvedBy: supervisor._id,
    disbursementDate: daysAgo(75)
  }));
  const schedMizan = await Installment.insertMany(buildInstallmentSchedule(loanMizan));

  // Mizan: 2 monthly installments paid
  for (let i = 0; i < 2; i++) {
    const inst = schedMizan[i];
    const paidAt = new Date(loanMizan.disbursementDate.getTime() + (i + 1) * 30 * 86400000);
    const payment = await Payment.create({
      borrowerId: bMizan._id, loanId: loanMizan._id, installmentId: inst._id,
      amount: inst.amountDue, paymentMethod: "Rocket",
      transactionId: `RKT-MZ-${3001 + i}`, paymentStatus: "approved",
      submittedAt: paidAt, approvedBy: admin._id, approvedAt: paidAt
    });
    inst.amountPaid = inst.amountDue; inst.status = "paid"; inst.paidAt = paidAt;
    await inst.save();
    await Receipt.create({
      receiptNumber: receiptNo(receiptCounter++),
      paymentId: payment._id, borrowerId: bMizan._id,
      loanId: loanMizan._id, installmentId: inst._id,
      amount: payment.amount, paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId, paymentDate: paidAt,
      approvedBy: admin._id
    });
  }

  // Sharmin loan: active, started 100 days ago (monthly, 4 installments) — overdue!
  const loanSharmin = await Loan.create(buildLoanData({
    borrowerId: bSharmin._id, product: prodAgri,
    principalAmount: 20000, approvedBy: admin._id,
    disbursementDate: daysAgo(100)
  }));
  const schedSharmin = await Installment.insertMany(buildInstallmentSchedule(loanSharmin));

  // Sharmin: only 1st paid, 2nd and 3rd overdue
  {
    const inst = schedSharmin[0];
    const paidAt = new Date(loanSharmin.disbursementDate.getTime() + 30 * 86400000);
    const payment = await Payment.create({
      borrowerId: bSharmin._id, loanId: loanSharmin._id, installmentId: inst._id,
      amount: inst.amountDue, paymentMethod: "bKash",
      transactionId: "BK-SH-4001", paymentStatus: "approved",
      submittedAt: paidAt, approvedBy: supervisor._id, approvedAt: paidAt
    });
    inst.amountPaid = inst.amountDue; inst.status = "paid"; inst.paidAt = paidAt;
    await inst.save();
    await Receipt.create({
      receiptNumber: receiptNo(receiptCounter++),
      paymentId: payment._id, borrowerId: bSharmin._id,
      loanId: loanSharmin._id, installmentId: inst._id,
      amount: payment.amount, paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId, paymentDate: paidAt,
      approvedBy: supervisor._id
    });
  }

  // ─── Overdue refresh + cases ──────────────────────────────────────────────
  await refreshOverdueInstallments();

  // Assign Sharmin's overdue installment to Rahim
  const overdueInst = schedSharmin[1];
  const caseOne = await OverdueCase.create({
    borrowerId: bSharmin._id, loanId: loanSharmin._id, installmentId: overdueInst._id,
    assignedOfficerId: officerRahim._id, caseStatus: "visited",
    priority: "urgent",
    notes: "Borrower says poultry market is down due to bird flu scare. Follow up weekly."
  });

  // Sharmin's 3rd overdue assigned to Kamal (newer, unvisited)
  const overdueInst2 = schedSharmin[2];
  const caseTwo = await OverdueCase.create({
    borrowerId: bSharmin._id, loanId: loanSharmin._id, installmentId: overdueInst2._id,
    assignedOfficerId: officerKamal._id, caseStatus: "assigned",
    priority: "normal",
    notes: "Second overdue installment. Coordinate with Rahim for joint visit."
  });

  // ─── Visit Logs ───────────────────────────────────────────────────────────
  await VisitLog.create([
    {
      caseId: caseOne._id, officerId: officerRahim._id,
      visitDate: daysAgo(10),
      visitOutcome: "Borrower met in person at farm site",
      borrowerResponse: "Stated that bird flu scare reduced chicken prices by 40%. Cannot pay this month but committed to pay next month.",
      nextFollowUpDate: daysAhead(5),
      notes: "Borrower was cooperative. Farm appears active. Recommends grace period."
    },
    {
      caseId: caseOne._id, officerId: officerRahim._id,
      visitDate: daysAgo(3),
      visitOutcome: "Follow-up phone call",
      borrowerResponse: "Will submit partial payment of ৳2,500 via bKash by Sunday.",
      nextFollowUpDate: daysAhead(4),
      notes: "Partial payment agreed. Update case to follow_up_required."
    }
  ]);

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  await AuditLog.create([
    { actorId: admin._id,      actorRole: "admin",      actionType: "loan_product_created",      targetType: "LoanProduct",     targetId: prodStarter._id,    description: "Created loan product: Small Business Starter" },
    { actorId: admin._id,      actorRole: "admin",      actionType: "loan_product_created",      targetType: "LoanProduct",     targetId: prodWomen._id,      description: "Created loan product: Women Entrepreneur Loan" },
    { actorId: admin._id,      actorRole: "admin",      actionType: "loan_product_created",      targetType: "LoanProduct",     targetId: prodAgri._id,       description: "Created loan product: Agriculture Support Loan" },
    { actorId: admin._id,      actorRole: "admin",      actionType: "loan_product_created",      targetType: "LoanProduct",     targetId: prodEmergency._id,  description: "Created loan product: Emergency Family Loan" },
    { actorId: admin._id,      actorRole: "admin",      actionType: "borrower_verified",         targetType: "BorrowerProfile", targetId: bAyesha._id,         description: "Verified Ayesha Begum's borrower profile" },
    { actorId: supervisor._id, actorRole: "supervisor", actionType: "borrower_verified",         targetType: "BorrowerProfile", targetId: bMizan._id,          description: "Verified Md. Mizanur Rahman's borrower profile" },
    { actorId: supervisor._id, actorRole: "supervisor", actionType: "borrower_verified",         targetType: "BorrowerProfile", targetId: bSharmin._id,        description: "Verified Sharmin Akter's borrower profile" },
    { actorId: admin._id,      actorRole: "admin",      actionType: "borrower_rejected",         targetType: "BorrowerProfile", targetId: bKobir._id,          description: "Rejected Md. Kobir Ahmed — NID mismatch" },
    { actorId: supervisor._id, actorRole: "supervisor", actionType: "loan_application_approved", targetType: "LoanApplication", targetId: appAyesha._id,       description: "Approved Ayesha Begum loan application ৳24,000" },
    { actorId: supervisor._id, actorRole: "supervisor", actionType: "loan_application_approved", targetType: "LoanApplication", targetId: appMizan._id,        description: "Approved Mizanur Rahman loan application ৳30,000" },
    { actorId: admin._id,      actorRole: "admin",      actionType: "loan_application_approved", targetType: "LoanApplication", targetId: appSharmin._id,      description: "Approved Sharmin Akter agri loan ৳20,000" },
    { actorId: admin._id,      actorRole: "admin",      actionType: "overdue_case_assigned",     targetType: "OverdueCase",     targetId: caseOne._id,         description: `Overdue case assigned to ${officerRahim.fullName}` },
    { actorId: admin._id,      actorRole: "admin",      actionType: "overdue_case_assigned",     targetType: "OverdueCase",     targetId: caseTwo._id,         description: `Overdue case assigned to ${officerKamal.fullName}` }
  ]);

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
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });

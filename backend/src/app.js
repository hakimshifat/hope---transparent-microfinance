const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const borrowerRoutes = require("./routes/borrower.routes");
const loanProductRoutes = require("./routes/loanProduct.routes");
const loanApplicationRoutes = require("./routes/loanApplication.routes");
const loanRoutes = require("./routes/loan.routes");
const installmentRoutes = require("./routes/installment.routes");
const paymentRoutes = require("./routes/payment.routes");
const ledgerRoutes = require("./routes/ledger.routes");
const receiptRoutes = require("./routes/receipt.routes");
const caseRoutes = require("./routes/case.routes");
const visitLogRoutes = require("./routes/visitLog.routes");
const auditLogRoutes = require("./routes/auditLog.routes");
const statsRoutes = require("./routes/stats.routes");
const notificationRoutes = require("./routes/notification.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Hope Microfinance API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/borrowers", borrowerRoutes);
app.use("/api/loan-products", loanProductRoutes);
app.use("/api/loan-applications", loanApplicationRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/installments", installmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/visit-logs", visitLogRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

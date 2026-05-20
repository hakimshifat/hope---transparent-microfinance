require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");
const bcrypt = require("bcryptjs");

async function ensureDefaultAdmin() {
  const adminCount = await prisma.user.count({ where: { role: "admin" } });
  if (adminCount > 0) return;

  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      fullName: process.env.DEFAULT_ADMIN_NAME || "System Admin",
      phone: process.env.DEFAULT_ADMIN_PHONE || "01700000000",
      email: process.env.DEFAULT_ADMIN_EMAIL || "admin@hope.local",
      password: hashedPassword,
      role: "admin",
      status: "active"
    }
  });

  console.log("Default admin created");
}

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  }

  await ensureDefaultAdmin();

  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => {
    console.log(`Hope API running on port ${port} [${process.env.NODE_ENV || "development"}]`);
  });

  // ─── Graceful shutdown ──────────────────────────────────────────────────
  async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Database disconnected. Goodbye.");
      process.exit(0);
    });

    // Force exit after 10 s if connections don't drain
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

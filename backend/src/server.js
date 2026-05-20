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
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
  await ensureDefaultAdmin();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Hope API running on port ${port}`);
  });
}

startServer().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");

async function ensureDefaultAdmin() {
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount > 0) return;

  await User.create({
    fullName: process.env.DEFAULT_ADMIN_NAME || "System Admin",
    phone: process.env.DEFAULT_ADMIN_PHONE || "01700000000",
    email: process.env.DEFAULT_ADMIN_EMAIL || "admin@hope.local",
    password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!",
    role: "admin",
    status: "active"
  });

  console.log("Default admin created");
}

async function startServer() {
  await connectDB();
  await ensureDefaultAdmin();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Hope API running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});

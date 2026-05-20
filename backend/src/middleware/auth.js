const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

function signToken(user) {
  return jwt.sign(
    { id: user.id || user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Account is not active" });
    }

    const safeUser = { ...user };
    delete safeUser.password;

    req.user = safeUser;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }

    next();
  };
}

module.exports = { protect, authorize, signToken };

// middleware/auth.js
const jwt = require("jsonwebtoken");
const { User, School } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "sikshyasanjal_secret");
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    // Resolve school from header
    const schoolDomain = req.headers["x-school-domain"];
    if (!schoolDomain) return res.status(400).json({ error: "School domain required" });

    const school = await School.findOne({ domain: schoolDomain.toLowerCase() });
    if (!school) return res.status(404).json({ error: "School not found" });

    if (user.school.toString() !== school._id.toString()) {
      return res.status(403).json({ error: "Access denied to this school" });
    }

    req.user = user;
    req.school = school;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
  }
  next();
};

module.exports = { authMiddleware, requireRole };

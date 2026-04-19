const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(morgan("dev"));
app.use(express.json());

// Rate limiting for OTP endpoint
const otpLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 5, message: "Too many OTP requests" });

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/teachers", require("./routes/teachers"));
app.use("/api/homework", require("./routes/homework"));
app.use("/api/notices", require("./routes/notices"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/results", require("./routes/results"));
app.use("/api/fees", require("./routes/fees"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/routine", require("./routes/routine"));
app.use("/api/calendar", require("./routes/calendar"));

// OTP rate limiting
app.use("/api/auth/otp", otpLimiter);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/sikshyasanjal")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

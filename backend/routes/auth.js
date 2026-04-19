const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, School } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "sikshyasanjal_secret";
const JWT_EXPIRES = "7d";

const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// POST /api/auth/login — Teacher/Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password, schoolDomain } = req.body;
    if (!email || !password || !schoolDomain) return res.status(400).json({ error: "All fields required" });

    const school = await School.findOne({ domain: schoolDomain.toLowerCase() });
    if (!school) return res.status(404).json({ error: "School not found" });

    const user = await User.findOne({ email, school: school._id, role: { $in: ["admin", "teacher"] } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/otp/send — Send OTP to parent's phone
router.post("/otp/send", async (req, res) => {
  try {
    const { phone, schoolDomain } = req.body;
    const school = await School.findOne({ domain: schoolDomain?.toLowerCase() });
    if (!school) return res.status(404).json({ error: "School not found" });

    const user = await User.findOne({ phone, school: school._id, role: "parent" });
    if (!user) return res.status(404).json({ error: "Parent not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // In production: send via Sparrow SMS
    // await sparrowSMS.send(phone, `Your SikshyaSanjal OTP is: ${otp}. Valid for 5 minutes.`);

    console.log(`[DEV] OTP for ${phone}: ${otp}`); // Dev only
    res.json({ message: "OTP sent", ...(process.env.NODE_ENV === "development" && { otp }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/otp/verify — Verify OTP
router.post("/otp/verify", async (req, res) => {
  try {
    const { phone, otp, schoolDomain } = req.body;
    const school = await School.findOne({ domain: schoolDomain?.toLowerCase() });
    if (!school) return res.status(404).json({ error: "School not found" });

    const user = await User.findOne({ phone, school: school._id, role: "parent" });
    if (!user) return res.status(404).json({ error: "Parent not found" });

    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, role: user.role, childIds: user.childIds } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google — Google OAuth callback
router.post("/google", async (req, res) => {
  try {
    const { idToken, schoolDomain } = req.body;
    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    const school = await School.findOne({ domain: schoolDomain?.toLowerCase() });
    if (!school) return res.status(404).json({ error: "School not found" });

    let user = await User.findOne({ email: payload.email, school: school._id });
    if (!user) return res.status(403).json({ error: "User not registered in this school" });

    user.googleId = payload.sub;
    await user.save();

    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

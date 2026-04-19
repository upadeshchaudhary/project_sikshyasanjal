const express = require("express");
const router = express.Router();
const { Attendance } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);
// GET by class+date or by student
router.get("/", async (req, res) => {
  const filter = { school: req.school._id };
  if (req.query.class) filter.class = req.query.class;
  if (req.query.date) filter.date = req.query.date;
  if (req.query.student) filter.student = req.query.student;
  res.json(await Attendance.find(filter).populate("student","name rollNo"));
});
// POST bulk attendance save
router.post("/bulk", requireRole("admin","teacher"), async (req, res) => {
  const { records } = req.body; // [{student, date, status, class}]
  const ops = records.map(r => ({
    updateOne: {
      filter: { school: req.school._id, student: r.student, date: r.date },
      update: { ...r, school: req.school._id, markedBy: req.user._id },
      upsert: true
    }
  }));
  await Attendance.bulkWrite(ops);
  res.json({ message: "Attendance saved" });
});
module.exports = router;

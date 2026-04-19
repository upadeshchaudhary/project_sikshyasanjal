const express = require("express");
const router = express.Router();
const { Student } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");

router.use(authMiddleware);

// GET /api/students — List all students (with optional class filter)
router.get("/", async (req, res) => {
  try {
    const { class: cls, search } = req.query;
    const filter = { school: req.school._id };
    if (cls) filter.class = cls;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { rollNo: { $regex: search, $options: "i" } }
    ];
    const students = await Student.find(filter).sort({ class: 1, rollNo: 1 });
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/students/:id
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, school: req.school._id });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/students — Add student (admin/teacher only)
router.post("/", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const student = new Student({ ...req.body, school: req.school._id });
    await student.save();
    res.status(201).json(student);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/students/:id — Update student
router.put("/:id", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, school: req.school._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/students/:id — Admin only
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    await Student.findOneAndDelete({ _id: req.params.id, school: req.school._id });
    res.json({ message: "Student removed" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

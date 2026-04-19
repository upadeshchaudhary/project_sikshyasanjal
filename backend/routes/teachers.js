// routes/teachers.js
const express = require("express");
const router = express.Router();
const { Teacher } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try { res.json(await Teacher.find({ school: req.school._id })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post("/", requireRole("admin"), async (req, res) => {
  try { const t = new Teacher({...req.body, school: req.school._id}); await t.save(); res.status(201).json(t); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.put("/:id", requireRole("admin"), async (req, res) => {
  try { const t = await Teacher.findOneAndUpdate({_id: req.params.id, school: req.school._id}, req.body, {new:true}); res.json(t); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try { await Teacher.findOneAndDelete({_id: req.params.id, school: req.school._id}); res.json({message:"Removed"}); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;

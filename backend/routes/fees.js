const express = require("express");
const router = express.Router();
const { FeeRecord } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);
router.get("/", async (req, res) => {
  const filter = { school: req.school._id };
  if (req.query.student) filter.student = req.query.student;
  if (req.query.status) filter.status = req.query.status;
  res.json(await FeeRecord.find(filter).populate("student","name class rollNo"));
});
router.get("/summary", requireRole("admin"), async (req, res) => {
  const fees = await FeeRecord.find({school:req.school._id});
  const total = fees.reduce((s,f)=>s+f.amount,0);
  const collected = fees.reduce((s,f)=>s+f.paid,0);
  const pending = total - collected;
  const overdue = fees.filter(f=>f.status==="overdue").length;
  res.json({total,collected,pending,overdue,rate:Math.round((collected/total)*100)});
});
router.post("/", requireRole("admin"), async (req, res) => {
  const f = new FeeRecord({...req.body,school:req.school._id}); await f.save(); res.status(201).json(f);
});
router.put("/:id", requireRole("admin"), async (req, res) => {
  res.json(await FeeRecord.findOneAndUpdate({_id:req.params.id,school:req.school._id},req.body,{new:true}));
});
module.exports = router;

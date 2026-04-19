const express = require("express");
const router = express.Router();
const { CalendarEvent } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);
router.get("/", async (req, res) => {
  const filter = {school:req.school._id};
  if (req.query.month) { filter.bsDate = {$regex:`^2082-${req.query.month.padStart(2,"0")}`}; }
  res.json(await CalendarEvent.find(filter).sort("bsDate"));
});
router.post("/", requireRole("admin"), async (req, res) => {
  const e = new CalendarEvent({...req.body,school:req.school._id,createdBy:req.user._id});
  await e.save(); res.status(201).json(e);
});
router.delete("/:id", requireRole("admin"), async (req, res) => {
  await CalendarEvent.findOneAndDelete({_id:req.params.id,school:req.school._id});
  res.json({message:"Deleted"});
});
module.exports = router;

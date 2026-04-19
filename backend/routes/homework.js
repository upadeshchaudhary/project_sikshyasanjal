const express = require("express");
const router = express.Router();
const { Homework } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);
router.get("/", async (req, res) => {
  const filter = { school: req.school._id };
  if (req.query.class) filter.class = req.query.class;
  res.json(await Homework.find(filter).populate("postedBy","name").sort("-createdAt"));
});
router.post("/", requireRole("admin","teacher"), async (req, res) => {
  const hw = new Homework({...req.body, school: req.school._id, postedBy: req.user._id});
  await hw.save(); res.status(201).json(hw);
});
router.put("/:id", requireRole("admin","teacher"), async (req, res) => {
  res.json(await Homework.findOneAndUpdate({_id:req.params.id,school:req.school._id},req.body,{new:true}));
});
router.delete("/:id", requireRole("admin","teacher"), async (req, res) => {
  await Homework.findOneAndDelete({_id:req.params.id,school:req.school._id}); res.json({message:"Deleted"});
});
module.exports = router;

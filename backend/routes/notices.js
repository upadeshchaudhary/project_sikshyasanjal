const express = require("express");
const router = express.Router();
const { Notice } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);
router.get("/", async (req, res) => {
  const filter = { school: req.school._id };
  if (req.query.category) filter.category = req.query.category;
  res.json(await Notice.find(filter).populate("postedBy","name").sort("-createdAt"));
});
router.post("/", requireRole("admin","teacher"), async (req, res) => {
  const n = new Notice({...req.body, school: req.school._id, postedBy: req.user._id});
  await n.save(); res.status(201).json(n);
});
router.delete("/:id", requireRole("admin","teacher"), async (req, res) => {
  await Notice.findOneAndDelete({_id:req.params.id,school:req.school._id}); res.json({message:"Deleted"});
});
module.exports = router;

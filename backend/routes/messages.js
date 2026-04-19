const express = require("express");
const router = express.Router();
const { Message } = require("../models");
const { authMiddleware } = require("../middleware/auth");
router.use(authMiddleware);
router.get("/", async (req, res) => {
  const msgs = await Message.find({
    school: req.school._id,
    $or: [{from:req.user._id},{to:req.user._id}],
    parentMessage: {$exists:false}
  }).populate("from","name role").populate("to","name role").sort("-createdAt");
  res.json(msgs);
});
router.get("/:id/thread", async (req, res) => {
  const thread = await Message.find({
    school: req.school._id,
    $or: [{_id:req.params.id},{parentMessage:req.params.id}]
  }).populate("from","name role").sort("createdAt");
  res.json(thread);
});
router.post("/", async (req, res) => {
  const m = new Message({...req.body,school:req.school._id,from:req.user._id});
  await m.save(); res.status(201).json(m);
});
router.put("/:id/read", async (req, res) => {
  await Message.findOneAndUpdate({_id:req.params.id,to:req.user._id},{read:true});
  res.json({message:"Marked read"});
});
module.exports = router;

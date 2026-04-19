const express = require("express");
const router = express.Router();
const { ClassRoutine } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);
router.get("/:class", async (req, res) => {
  const r = await ClassRoutine.findOne({school:req.school._id,class:req.params.class});
  res.json(r||{});
});
router.put("/:class", requireRole("admin","teacher"), async (req, res) => {
  const r = await ClassRoutine.findOneAndUpdate(
    {school:req.school._id,class:req.params.class},
    {slots:req.body.slots,updatedAt:new Date()},
    {upsert:true,new:true}
  );
  res.json(r);
});
module.exports = router;

const express = require("express");
const router = express.Router();
const { ExamResult } = require("../models");
const { authMiddleware, requireRole } = require("../middleware/auth");
router.use(authMiddleware);
const calcGrade = (pct) => {
  if (pct>=90) return {grade:"A+",gpa:4.0}; if (pct>=80) return {grade:"A",gpa:3.6};
  if (pct>=70) return {grade:"B+",gpa:3.2}; if (pct>=60) return {grade:"B",gpa:2.8};
  if (pct>=50) return {grade:"C+",gpa:2.4}; if (pct>=40) return {grade:"C",gpa:2.0};
  return {grade:"NG",gpa:0};
};
router.get("/", async (req, res) => {
  const filter = { school: req.school._id };
  if (req.query.student) filter.student = req.query.student;
  if (req.query.class) filter.class = req.query.class;
  res.json(await ExamResult.find(filter).populate("student","name rollNo class"));
});
router.post("/", requireRole("admin","teacher"), async (req, res) => {
  const { student, exam, class: cls, subjects } = req.body;
  const totalObtained = subjects.reduce((s,sub)=>s+sub.obtained,0);
  const totalFull = subjects.reduce((s,sub)=>s+sub.fullMarks,0);
  const pct = Math.round((totalObtained/totalFull)*100);
  const {grade, gpa} = calcGrade(pct);
  const enrichedSubjects = subjects.map(sub => {
    const subPct = Math.round((sub.obtained/sub.fullMarks)*100);
    const {grade:g,gpa:gpaVal} = calcGrade(subPct);
    return {...sub, grade:g, gpa:gpaVal};
  });
  const result = new ExamResult({
    school: req.school._id, student, exam, class: cls,
    subjects: enrichedSubjects, totalObtained, totalFull,
    percentage: pct, overallGrade: grade, overallGpa: gpa,
    uploadedBy: req.user._id
  });
  await result.save(); res.status(201).json(result);
});
module.exports = router;

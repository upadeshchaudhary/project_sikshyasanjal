// backend/models/index.js
// Central barrel — all routes do: const { User, School, Student, ... } = require("../models")

const School      = require("./School");
const User        = require("./User");
const Student     = require("./Student");
const Homework    = require("./Homework");
const Notice      = require("./Notice");
const Attendance  = require("./Attendance");
const ExamResult  = require("./ExamResult");
const FeeRecord   = require("./FeeRecord");
const Message     = require("./Message");
const ClassRoutine = require("./ClassRoutine");
const AcademicCalendar = require("./AcademicCalendar");

module.exports = {
  School,
  User,
  Student,
  Homework,
  Notice,
  Attendance,
  ExamResult,
  FeeRecord,
  Message,
  ClassRoutine,
  AcademicCalendar,
};
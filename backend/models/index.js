const mongoose = require("mongoose");
const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sikshyasanjal';

mongoose.connect(dbURI)
  .then(() => console.log('✅ Connected to Local MongoDB'))
  .catch((err) => console.error('❌ Connection error:', err));
const { Schema } = mongoose;

// ─── School ────────────────────────────────────────────────────────────────
const schoolSchema = new Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true, lowercase: true },
  address: String,
  phone: String,
  estYear: Number,
  createdAt: { type: Date, default: Date.now }
});
const School = mongoose.model("School", schoolSchema);

// ─── User ─────────────────────────────────────────────────────────────────
const userSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  passwordHash: String,
  role: { type: String, enum: ["admin", "teacher", "parent"], required: true },
  googleId: String,
  otp: String,
  otpExpiry: Date,
  childIds: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

// ─── Student ──────────────────────────────────────────────────────────────
const studentSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  class: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  dob: String,
  address: String,
  parentName: String,
  parentPhone: String,
  parentUserId: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model("Student", studentSchema);

// ─── Teacher ──────────────────────────────────────────────────────────────
const teacherSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  subject: String,
  qualification: String,
  phone: String,
  email: String,
  classes: [String],
  joiningDate: String,
  createdAt: { type: Date, default: Date.now }
});
const Teacher = mongoose.model("Teacher", teacherSchema);

// ─── Homework ─────────────────────────────────────────────────────────────
const homeworkSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  title: { type: String, required: true },
  subject: String,
  class: { type: String, required: true },
  description: String,
  dueDate: String,
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  postedBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
const Homework = mongoose.model("Homework", homeworkSchema);

// ─── Notice ───────────────────────────────────────────────────────────────
const noticeSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["exam", "holiday", "event", "urgent", "general"], default: "general" },
  important: { type: Boolean, default: false },
  postedBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
const Notice = mongoose.model("Notice", noticeSchema);

// ─── Attendance ───────────────────────────────────────────────────────────
const attendanceSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  class: String,
  date: { type: String, required: true }, // BS date YYYY-MM-DD
  status: { type: String, enum: ["present", "absent", "late", "excused"], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
attendanceSchema.index({ school: 1, student: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model("Attendance", attendanceSchema);

// ─── ExamResult ───────────────────────────────────────────────────────────
const examResultSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  exam: { type: String, required: true },
  class: String,
  subjects: [{
    name: String,
    fullMarks: Number,
    passMarks: Number,
    obtained: Number,
    grade: String,
    gpa: Number
  }],
  totalObtained: Number,
  totalFull: Number,
  percentage: Number,
  overallGrade: String,
  overallGpa: Number,
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
const ExamResult = mongoose.model("ExamResult", examResultSchema);

// ─── FeeRecord ────────────────────────────────────────────────────────────
const feeRecordSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  status: { type: String, enum: ["paid", "partial", "pending", "overdue"], default: "pending" },
  dueDate: String,
  paidDate: String,
  method: { type: String, enum: ["cash", "bank_transfer", "esewa", "khalti", null] },
  term: String,
  createdAt: { type: Date, default: Date.now }
});
const FeeRecord = mongoose.model("FeeRecord", feeRecordSchema);

// ─── Message ──────────────────────────────────────────────────────────────
const messageSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  from: { type: Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  parentMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// ─── ClassRoutine ─────────────────────────────────────────────────────────
const classRoutineSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  class: { type: String, required: true },
  slots: [{
    day: { type: String, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] },
    period: Number,
    subject: String,
    teacher: String,
    room: String,
    time: String
  }],
  updatedAt: { type: Date, default: Date.now }
});
const ClassRoutine = mongoose.model("ClassRoutine", classRoutineSchema);

// ─── AcademicCalendar ─────────────────────────────────────────────────────
const calendarEventSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  title: { type: String, required: true },
  bsDate: { type: String, required: true },
  type: { type: String, enum: ["holiday", "exam", "event", "meeting"], default: "event" },
  description: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);

module.exports = { School, User, Student, Teacher, Homework, Notice, Attendance, ExamResult, FeeRecord, Message, ClassRoutine, CalendarEvent };

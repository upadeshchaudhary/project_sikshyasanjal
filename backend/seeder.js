/**
 * SikshyaSanjal Database Seeder
 * Run: node seeder.js
 * Creates a demo school with admin, teachers, students, and parents
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { School, User, Student, Teacher, Homework, Notice } = require("./models");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sikshyasanjal";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Clean up
  await Promise.all([School, User, Student, Teacher, Homework, Notice].map(M => M.deleteMany({})));
  console.log("🗑️  Cleared existing data");

  // Create school
  const school = await School.create({
    name: "Shree Saraswati Secondary School",
    domain: "saraswati",
    address: "Kathmandu, Nepal",
    phone: "+977-1-4567890",
    estYear: 2041
  });
  console.log(`🏫 School created: ${school.name}`);

  // Admin
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await User.create({
    school: school._id, name: "Prakash Regmi",
    email: "admin@saraswati.edu.np", passwordHash: adminHash, role: "admin"
  });

  // Teachers
  const teacherData = [
    { name: "Sunita Koirala", email: "sunita@saraswati.edu.np", subject: "Mathematics", classes: ["10A","10B","9A"], qualification: "M.Ed Mathematics" },
    { name: "Ramesh Dhakal", email: "ramesh@saraswati.edu.np", subject: "Science", classes: ["9A","9B","8A"], qualification: "B.Sc Physics" },
    { name: "Meena Shrestha", email: "meena@saraswati.edu.np", subject: "Nepali", classes: ["10A","9B","8B"], qualification: "M.A. Nepali" },
  ];

  for (const td of teacherData) {
    const hash = await bcrypt.hash("teacher123", 12);
    const user = await User.create({ school: school._id, ...td, passwordHash: hash, role: "teacher" });
    await Teacher.create({ school: school._id, userId: user._id, ...td, phone: "985100000" + Math.floor(Math.random()*9) });
  }
  console.log(`👩‍🏫 ${teacherData.length} teachers created`);

  // Students & parents
  const studentData = [
    { rollNo:"001", name:"Aarav Sharma", class:"10A", gender:"Male", parentName:"Rajesh Sharma", parentPhone:"9841000001" },
    { rollNo:"002", name:"Priya Thapa", class:"10A", gender:"Female", parentName:"Mohan Thapa", parentPhone:"9841000002" },
    { rollNo:"003", name:"Bikash Karki", class:"10B", gender:"Male", parentName:"Sita Karki", parentPhone:"9841000003" },
    { rollNo:"004", name:"Srijana Gurung", class:"9A", gender:"Female", parentName:"Dhan Gurung", parentPhone:"9841000004" },
  ];

  for (const sd of studentData) {
    const student = await Student.create({ school: school._id, ...sd });
    const parent = await User.create({
      school: school._id, name: sd.parentName, phone: sd.parentPhone,
      role: "parent", childIds: [student._id]
    });
    student.parentUserId = parent._id;
    await student.save();
  }
  console.log(`👦 ${studentData.length} students + parents created`);

  // Sample homework
  await Homework.create([
    { school: school._id, title: "Quadratic Equations", subject: "Mathematics", class: "10A", priority: "high", dueDate: "2082-01-20", postedBy: admin._id },
    { school: school._id, title: "Essay: My School", subject: "Nepali", class: "9B", priority: "medium", dueDate: "2082-01-22", postedBy: admin._id },
  ]);

  // Sample notices
  await Notice.create([
    { school: school._id, title: "Annual Sports Day 2082", category: "event", important: true, content: "Annual Sports Day will be held on Falgun 15.", postedBy: admin._id },
    { school: school._id, title: "First Term Exam Schedule", category: "exam", important: true, content: "Exams commence from Falgun 20.", postedBy: admin._id },
  ]);

  console.log("✨ Seeding complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("   Admin     — email: admin@saraswati.edu.np | pass: admin123 | domain: saraswati");
  console.log("   Teacher   — email: sunita@saraswati.edu.np | pass: teacher123 | domain: saraswati");
  console.log("   Parent    — phone: 9841000001 | OTP sent via SMS | domain: saraswati");

  await mongoose.disconnect();
}

seed().catch(err => { console.error("Seeder error:", err); process.exit(1); });

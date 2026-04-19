
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           SikshyaSanjal — Complete Database Seeder           ║
 * ║                                                              ║
 * ║  Run:  node seeder.js                                        ║
 * ║                                                              ║
 * ║  Seeds: School, Users (Admin + Teachers + Parents),          ║
 * ║         Students, Teachers, Homework, Notices, Attendance,   ║
 * ║         ExamResults, FeeRecords, Messages,                   ║
 * ║         ClassRoutines, CalendarEvents                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  School, User, Student, Teacher,
  Homework, Notice, Attendance, ExamResult,
  FeeRecord, Message, ClassRoutine, CalendarEvent,
} = require("./models");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sikshyasanjal";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Drop all collections cleanly (removes stale indexes too)
  const allModels = [
    School, User, Student, Teacher,
    Homework, Notice, Attendance, ExamResult,
    FeeRecord, Message, ClassRoutine, CalendarEvent,
  ];
  for (const M of allModels) {
    try { await M.collection.drop(); } catch (_) {}
  }
  await Promise.all(allModels.map(M => M.syncIndexes()));
  console.log("Cleared existing data");

  // School
  const school = await School.create({
    name: "SikshyaSanjal Academy",
    domain: "sikshyasanjal",
    address: "Kathmandu, Nepal",
    phone: "+977-1-4567890",
    estYear: 2041,
  });
  console.log("School created:", school.name);

  // Admin
  const adminUser = await User.create({
    school: school._id,
    name: "Prakash Regmi",
    email: "admin@sikshyasanjal.edu.np",
    passwordHash: await bcrypt.hash("admin123", 12),
    role: "admin",
  });
  console.log("Admin created:", adminUser.email);

  // Teachers
  const teacherDefs = [
    { name:"Sunita Koirala",   email:"sunita@sikshyasanjal.edu.np",   phone:"9851000001", subject:"Mathematics",   qualification:"M.Ed Mathematics", classes:["10A","10B","9A"] },
    { name:"Ramesh Dhakal",    email:"ramesh@sikshyasanjal.edu.np",    phone:"9851000002", subject:"Science",        qualification:"B.Sc Physics",      classes:["9A","9B","8A"]  },
    { name:"Meena Shrestha",   email:"meena@sikshyasanjal.edu.np",     phone:"9851000003", subject:"Nepali",         qualification:"M.A. Nepali",       classes:["10A","9B","8B"] },
    { name:"Prakash Adhikari", email:"prakash@sikshyasanjal.edu.np",   phone:"9851000004", subject:"English",        qualification:"M.A. English",       classes:["10B","9A","7A"] },
    { name:"Kamala Thapa",     email:"kamala@sikshyasanjal.edu.np",    phone:"9851000005", subject:"Social Studies", qualification:"B.Ed Social",        classes:["8A","8B","7A"]  },
  ];

  const teacherUsers = [];
  const pw = await bcrypt.hash("teacher123", 12);
  for (const t of teacherDefs) {
    const user = await User.create({ school: school._id, name: t.name, email: t.email, passwordHash: pw, role: "teacher" });
    await Teacher.create({ school: school._id, userId: user._id, ...t });
    teacherUsers.push(user);
    console.log("Teacher created:", t.name);
  }
  const [sunita, ramesh, meena, prakashT, kamala] = teacherUsers;

  // Students + Parents
  const studentDefs = [
    { rollNo:"001", name:"Aarav Sharma",    class:"10A", gender:"Male",   dob:"2066-05-12", address:"Baneshwor, Kathmandu", parentName:"Rajesh Sharma",  parentPhone:"9841000001" },
    { rollNo:"002", name:"Priya Thapa",     class:"10A", gender:"Female", dob:"2066-08-20", address:"Patan, Lalitpur",      parentName:"Mohan Thapa",    parentPhone:"9841000002" },
    { rollNo:"003", name:"Bikash Karki",    class:"10B", gender:"Male",   dob:"2066-11-03", address:"Bhaktapur",            parentName:"Sita Karki",     parentPhone:"9841000003" },
    { rollNo:"004", name:"Srijana Gurung",  class:"9A",  gender:"Female", dob:"2067-02-17", address:"Kirtipur, Kathmandu",  parentName:"Dhan Gurung",    parentPhone:"9841000004" },
    { rollNo:"005", name:"Rohan Pandey",    class:"9A",  gender:"Male",   dob:"2067-06-29", address:"Kalanki, Kathmandu",   parentName:"Hari Pandey",    parentPhone:"9841000005" },
    { rollNo:"006", name:"Anjali Rai",      class:"9B",  gender:"Female", dob:"2067-09-14", address:"Boudha, Kathmandu",    parentName:"Bishnu Rai",     parentPhone:"9841000006" },
    { rollNo:"007", name:"Dipesh Tamang",   class:"8A",  gender:"Male",   dob:"2068-01-08", address:"Tokha, Kathmandu",     parentName:"Karma Tamang",   parentPhone:"9841000007" },
    { rollNo:"008", name:"Manisha Shrestha",class:"8A",  gender:"Female", dob:"2068-04-22", address:"Lalitpur",             parentName:"Purna Shrestha", parentPhone:"9841000008" },
  ];

  const studentDocs = [];
  for (const s of studentDefs) {
    const student = await Student.create({ school: school._id, ...s });
    const parent  = await User.create({ school: school._id, name: s.parentName, phone: s.parentPhone, role: "parent", childIds: [student._id] });
    student.parentUserId = parent._id;
    await student.save();
    studentDocs.push(student);
    console.log("Student created:", s.name, "| Parent:", s.parentName);
  }

  // Homework
  await Homework.insertMany([
    { school: school._id, title:"Quadratic Equations Practice Set", subject:"Mathematics",   class:"10A", description:"Complete exercises 5.1 to 5.4.", dueDate:"2082-01-20", priority:"high",   postedBy: sunita._id },
    { school: school._id, title:"Essay: My Neighbourhood",          subject:"Nepali",         class:"9B",  description:"Write a 500-word essay.",         dueDate:"2082-01-22", priority:"medium", postedBy: meena._id  },
    { school: school._id, title:"Lab Report: Photosynthesis",       subject:"Science",        class:"9A",  description:"Complete the lab report.",        dueDate:"2082-01-25", priority:"high",   postedBy: ramesh._id },
    { school: school._id, title:"Reading Comprehension Chapter 7",  subject:"English",        class:"10B", description:"Read and answer questions.",      dueDate:"2082-01-21", priority:"low",    postedBy: prakashT._id },
    { school: school._id, title:"Map Work: Nepal Districts",        subject:"Social Studies", class:"8A",  description:"Label all 77 districts.",         dueDate:"2082-01-23", priority:"medium", postedBy: kamala._id },
  ]);
  console.log("Homework created");

  // Notices
  await Notice.insertMany([
    { school: school._id, title:"Annual Sports Day 2082",   category:"event",   important:true,  content:"Annual Sports Day on Falgun 15. All students must participate.", postedBy: adminUser._id },
    { school: school._id, title:"First Term Exam Schedule", category:"exam",    important:true,  content:"Exams start Falgun 20. Carry your admit card.",                  postedBy: adminUser._id },
    { school: school._id, title:"Fee Submission Deadline",  category:"urgent",  important:true,  content:"Last date for fee submission is Falgun 25.",                     postedBy: adminUser._id },
    { school: school._id, title:"School Closed - Holi",     category:"holiday", important:false, content:"School closed on Falgun 28 for Holi. Reopens Chaitra 1.",        postedBy: adminUser._id },
  ]);
  console.log("Notices created");

  // Fee Records
  const feeRecords = [];
  for (const student of studentDocs) {
    feeRecords.push({ school: school._id, student: student._id, term:"First Term 2082",  amount:5500, paid:5500, status:"paid",    dueDate:"2082-04-30", paidDate:"2082-04-15", method:"cash" });
    feeRecords.push({ school: school._id, student: student._id, term:"Second Term 2082", amount:5500, paid:0,    status:"pending", dueDate:"2082-08-31" });
  }
  await FeeRecord.insertMany(feeRecords);
  console.log("Fee records created");

  // Calendar Events
  await CalendarEvent.insertMany([
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-01-05", title:"Academic Year Begins",        type:"event",   description:"Orientation for new students." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-03-10", title:"First Term Exam Begins",      type:"exam",    description:"Exams commence for all classes." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-03-25", title:"First Term Results",          type:"exam",    description:"Results published." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-04-20", title:"Annual Sports Day",           type:"event",   description:"Inter-class sports competition." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-05-15", title:"Buddha Jayanti",              type:"holiday", description:"School closed." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-07-17", title:"Dashain Vacation Begins",     type:"holiday", description:"School closed for Dashain." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-08-01", title:"Tihar Vacation",              type:"holiday", description:"School closed for Tihar." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-11-07", title:"Maha Shivaratri",             type:"holiday", description:"School closed." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-11-10", title:"Final Exam Begins",           type:"exam",    description:"Annual final examinations." },
    { school: school._id, createdBy: adminUser._id, bsDate:"2082-12-01", title:"Graduation Ceremony",         type:"event",   description:"Farewell for Class 10 students." },
  ]);
  console.log("Calendar events created");

  console.log("\n--- Seeding Complete ---\n");
  console.log("Admin   : admin@sikshyasanjal.edu.np  | password: admin123");
  console.log("Teacher : sunita@sikshyasanjal.edu.np | password: teacher123");
  console.log("Parent  : phone 9841000001            | OTP login");
  console.log("Domain  : sikshyasanjal\n");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seeder failed:", err.message);
  process.exit(1);
});
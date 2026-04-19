import { useState, useEffect, useMemo } from "react";
import Topbar from "../components/Topbar";
import { mockStudents, CLASSES } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { getDaysInBSMonth, BS_MONTH_NAMES } from "../utils/calendar";
import toast from "react-hot-toast";
import { Save, ChevronLeft, ChevronRight, Clock, Info } from "lucide-react";

// ─── Nepal Academic Year ───────────────────────────────────────────────────────
// Academic year runs Baisakh (month 1) to Chaitra (month 12) of BS 2082
const ACADEMIC_YEAR = 2082;

// Today's BS date — current date is 10 March 2026 AD = 26 Falgun 2082 BS
const TODAY_BS = { year: 2082, month: 11, day: 26 }; // Falgun = month 11

// ─── Nepal Public Holidays 2082 BS ────────────────────────────────────────────
// Format: "YYYY-MM-DD" in BS
const NEPAL_HOLIDAYS = {
  // Baisakh
  "2082-01-01": "New Year / Navavarsha",
  "2082-01-07": "Ram Navami",
  // Jestha
  "2082-02-15": "Buddha Jayanti (Swasthani Purnima)",
  // Ashadh — none major
  // Shrawan
  "2082-04-17": "Janai Purnima / Raksha Bandhan",
  "2082-04-18": "Gai Jatra",
  // Bhadra
  "2082-05-17": "Teej",
  // Ashwin
  "2082-06-01": "Ghatasthapana (Dashain begins)",
  "2082-06-07": "Fulpati",
  "2082-06-08": "Maha Ashtami",
  "2082-06-09": "Maha Navami",
  "2082-06-10": "Vijaya Dashami",
  "2082-06-11": "Ekadashi",
  "2082-06-12": "Dwadashi",
  "2082-06-13": "Trayodashi",
  "2082-06-14": "Kojagrat Purnima (Dashain ends)",
  // Kartik
  "2082-07-01": "Dhanteras",
  "2082-07-02": "Kali Chaturdashi (Narak Chaturdashi)",
  "2082-07-03": "Laxmi Puja (Tihar)",
  "2082-07-04": "Gobardhan Puja / Mha Puja",
  "2082-07-05": "Bhai Tika",
  "2082-07-15": "Chhath Parva",
  // Mangsir
  "2082-08-29": "Constitution Day",
  // Poush
  "2082-09-01": "Poush 1 (Winter Holiday begins)",
  // Magh
  "2082-10-01": "Maghe Sankranti",
  "2082-10-18": "Maha Shivaratri (actual BS date)",
  // Falgun
  "2082-11-05": "Maha Shivaratri",
  "2082-11-20": "Holi (Hill)",
  // Chaitra
  "2082-12-09": "Ghode Jatra",
  "2082-12-30": "Chaitra Last Day",
};

// School vacation blocks (ranges inclusive, in BS)
// Format: [year, month, startDay, endDay, label]
const SCHOOL_VACATIONS = [
  [2082, 6,  1, 14, "Dashain Vacation"],
  [2082, 7,  1,  5, "Tihar Vacation"],
  [2082, 9,  1, 10, "Winter Vacation"],
  [2082,12, 25, 30, "End of Year"],
];

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["present","absent","late","excused"];
const STATUS_LABEL   = { present:"P", absent:"A", late:"L", excused:"E" };
const STATUS_FULL    = { present:"Present", absent:"Absent", late:"Late", excused:"Excused" };
const STATUS_COLOR   = { present:"#15803D", absent:"#DC2626", late:"#D97706", excused:"#7C3AED" };
const STATUS_BG      = { present:"#DCFCE7", absent:"#FEE2E2", late:"#FEF3C7", excused:"#EDE9FE" };

// Day names — Nepal week: Sun–Thu full day, Fri half day, Sat holiday
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function isFriday(dayOfWeek)   { return dayOfWeek === 5; } // 0=Sun
function isSaturday(dayOfWeek) { return dayOfWeek === 6; }

// Get day-of-week for day 1 of a BS month (approximation using known anchor)
// Anchor: 1 Baisakh 2082 = Saturday (April 14 2025 AD) = dayOfWeek 6
const ANCHOR = { year: 2082, month: 1, day: 1, dow: 6 };

function getDaysBefore(year, month) {
  // Count total BS days from anchor year start to start of this month
  let total = 0;
  for (let y = ANCHOR.year; y < year; y++) {
    for (let m = 1; m <= 12; m++) total += getDaysInBSMonth(y, m);
  }
  for (let m = ANCHOR.month; m < month; m++) total += getDaysInBSMonth(year, m);
  return total;
}

function getFirstDayOfMonth(year, month) {
  const days = getDaysBefore(year, month);
  return (ANCHOR.dow + days) % 7;
}

function isHolidayDate(year, month, day) {
  const key = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  return NEPAL_HOLIDAYS[key] || null;
}

function isVacationDate(year, month, day) {
  for (const [vy, vm, vs, ve, label] of SCHOOL_VACATIONS) {
    if (vy === year && vm === month && day >= vs && day <= ve) return label;
  }
  return null;
}

function isPastOrToday(year, month, day) {
  if (year < TODAY_BS.year) return true;
  if (year === TODAY_BS.year && month < TODAY_BS.month) return true;
  if (year === TODAY_BS.year && month === TODAY_BS.month && day <= TODAY_BS.day) return true;
  return false;
}

// Generate realistic attendance for a student for a given month
// Only generates for past/today dates; skips weekends, holidays, vacations
function generateAttendanceForMonth(studentId, year, month) {
  const days   = getDaysInBSMonth(year, month);
  const firstDow = getFirstDayOfMonth(year, month);
  const seed   = studentId.charCodeAt(studentId.length - 1) * 3 + month + year;
  const result = {};

  for (let d = 1; d <= days; d++) {
    if (!isPastOrToday(year, month, d)) break; // stop at today

    const dow      = (firstDow + d - 1) % 7;
    const key      = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const holiday  = isHolidayDate(year, month, d);
    const vacation = isVacationDate(year, month, d);

    if (isSaturday(dow))       { result[key] = "holiday"; continue; }
    if (holiday || vacation)   { result[key] = "holiday"; continue; }
    // Friday is half-day but attendance is still marked
    // Weighted random: 88% present, 6% absent, 4% late, 2% excused
    const r = (d * 7 + seed * 13) % 100;
    if (r < 88)      result[key] = "present";
    else if (r < 94) result[key] = "absent";
    else if (r < 98) result[key] = "late";
    else             result[key] = "excused";
  }
  return result;
}

// ─── Live Nepal Clock ──────────────────────────────────────────────────────────
function NepalClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const nepalMs = now.getTime() + now.getTimezoneOffset() * 60000 + (5*60+45)*60000;
  const n       = new Date(nepalMs);
  const h       = (n.getHours() % 12 || 12).toString().padStart(2,"0");
  const m       = n.getMinutes().toString().padStart(2,"0");
  const s       = n.getSeconds().toString().padStart(2,"0");
  const ampm    = n.getHours() >= 12 ? "PM" : "AM";
  const days    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--card)",
      border:"1px solid var(--border)", borderRadius:10, padding:"8px 14px", boxShadow:"var(--shadow)" }}>
      <Clock size={14} style={{ color:"var(--blue)" }}/>
      <div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:"var(--text)" }}>
          {h}:{m}:{s}
        </span>
        <span style={{ fontSize:11, color:"var(--text-3)", marginLeft:5 }}>{ampm} · {days[n.getDay()]} · NST</span>
      </div>
    </div>
  );
}

// ─── Month Selector — only Baisakh–Chaitra 2082 ──────────────────────────────
function MonthNav({ year, month, onChange }) {
  // Academic year = months 1–12 of 2082
  // Can't go beyond current month
  const canPrev = !(year === ACADEMIC_YEAR && month === 1);
  const canNext = !(year === TODAY_BS.year && month >= TODAY_BS.month);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <button className="btn btn-outline btn-sm" disabled={!canPrev}
        onClick={() => onChange(month === 1 ? year-1 : year, month === 1 ? 12 : month-1)}>
        <ChevronLeft size={14}/>
      </button>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
        color:"var(--text)", minWidth:160, textAlign:"center" }}>
        {BS_MONTH_NAMES[month-1]} {year} BS
      </span>
      <button className="btn btn-outline btn-sm" disabled={!canNext}
        onClick={() => onChange(month === 12 ? year+1 : year, month === 12 ? 1 : month+1)}>
        <ChevronRight size={14}/>
      </button>
    </div>
  );
}

// ─── Single-student Attendance Calendar ───────────────────────────────────────
function StudentCalendar({ student, year, month, onMonthChange, compact = false }) {
  const [hovered, setHovered] = useState(null);
  const days      = getDaysInBSMonth(year, month);
  const firstDow  = getFirstDayOfMonth(year, month);
  const attData   = useMemo(() => generateAttendanceForMonth(student.id, year, month), [student.id, year, month]);
  const monthName = BS_MONTH_NAMES[month - 1];

  // Summary counts
  const counts = { present:0, absent:0, late:0, excused:0, holiday:0, future:0 };
  for (let d = 1; d <= days; d++) {
    const dow = (firstDow + d - 1) % 7;
    const key = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (!isPastOrToday(year, month, d)) counts.future++;
    else if (attData[key]) counts[attData[key]]++;
  }
  const schoolDays = counts.present + counts.absent + counts.late + counts.excused;
  const rate = schoolDays > 0 ? Math.round(((counts.present + counts.late) / schoolDays) * 100) : null;

  return (
    <div className="card" style={{ marginBottom: compact ? 0 : 8 }}>
      {/* Card header */}
      <div className="card-header" style={{ paddingBottom:10 }}>
        <div>
          <div className="card-title" style={{ fontSize: compact ? 13 : 15 }}>{student.name}</div>
          <div style={{ fontSize:11, color:"var(--text-3)", marginTop:1 }}>
            Class {student.class} · Roll No. {student.rollNo}
          </div>
        </div>
        <MonthNav year={year} month={month} onChange={onMonthChange} />
      </div>

      <div className="card-body" style={{ paddingTop:0 }}>
        {/* Day-of-week headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
          {DAY_NAMES.map((d,i) => (
            <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, paddingBottom:4,
              color: i===6 ? "#DC2626" : i===5 ? "#D97706" : "var(--text-3)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {/* Empty cells before first day */}
          {Array.from({ length: firstDow }, (_,i) => <div key={`e${i}`}/>)}

          {Array.from({ length: days }, (_,i) => {
            const day    = i + 1;
            const dow    = (firstDow + i) % 7;
            const key    = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const status = attData[key];
            const future = !isPastOrToday(year, month, day);
            const isSat  = isSaturday(dow);
            const isFri  = isFriday(dow);
            const isToday = year === TODAY_BS.year && month === TODAY_BS.month && day === TODAY_BS.day;

            const holiday  = isHolidayDate(year, month, day);
            const vacation = isVacationDate(year, month, day);

            let bg      = "var(--canvas)";
            let color   = "var(--text-3)";
            let badge   = "";
            let title   = `${day} ${monthName} ${year} BS`;
            let opacity = 1;

            if (future) {
              bg = "transparent"; color = "var(--border)"; opacity = 0.5;
            } else if (status === "holiday" || isSat) {
              bg = "#FEF2F2"; color = "#DC2626"; badge = "H";
              title += ` · ${isSat ? "Saturday Holiday" : (holiday || vacation || "Holiday")}`;
            } else if (status === "present") {
              bg = STATUS_BG.present; color = STATUS_COLOR.present; badge = "P";
              title += " · Present";
            } else if (status === "absent") {
              bg = STATUS_BG.absent; color = STATUS_COLOR.absent; badge = "A";
              title += " · Absent";
            } else if (status === "late") {
              bg = STATUS_BG.late; color = STATUS_COLOR.late; badge = "L";
              title += " · Late" + (isFri ? " (half day)" : "");
            } else if (status === "excused") {
              bg = STATUS_BG.excused; color = STATUS_COLOR.excused; badge = "E";
              title += " · Excused";
            }

            return (
              <div key={day}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                title={title}
                style={{
                  borderRadius:6, padding:"6px 2px", textAlign:"center",
                  cursor: future ? "default" : "pointer",
                  background: bg, opacity,
                  border: isToday ? "2px solid var(--blue)" : hovered===day && !future ? "2px solid var(--border)" : "2px solid transparent",
                  transition:"border 0.1s",
                  position:"relative",
                }}
              >
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color, lineHeight:1.2 }}>
                  {day}
                </div>
                {badge && !future && (
                  <div style={{ fontSize:8, fontWeight:800, color, marginTop:1, letterSpacing:"0.02em" }}>{badge}</div>
                )}
                {isFri && !future && !isSat && status !== "holiday" && (
                  <div style={{ position:"absolute", bottom:1, right:2, fontSize:6, color:"#D97706", fontWeight:700 }}>½</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tooltip for hovered day */}
        {hovered && (() => {
          const dow     = (firstDow + hovered - 1) % 7;
          const key     = `${year}-${String(month).padStart(2,"0")}-${String(hovered).padStart(2,"0")}`;
          const status  = attData[key];
          const future  = !isPastOrToday(year, month, hovered);
          const holiday = isHolidayDate(year, month, hovered);
          const vacation= isVacationDate(year, month, hovered);
          if (future) return null;
          const label = isSaturday(dow) ? "Saturday Holiday"
            : status === "holiday" ? (holiday || vacation || "School Holiday")
            : STATUS_FULL[status] || "—";
          const col = isSaturday(dow) || status==="holiday" ? "#DC2626"
            : status ? STATUS_COLOR[status] : "var(--text-3)";
          const bg2 = isSaturday(dow) || status==="holiday" ? "#FEF2F2"
            : status ? STATUS_BG[status] : "var(--canvas)";
          return (
            <div style={{ marginTop:10, padding:"8px 12px", background:bg2, borderRadius:8,
              display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
              <span style={{ fontWeight:600, color:"var(--text)" }}>
                {hovered} {monthName} {year} BS
              </span>
              <span style={{ color: col, fontWeight:700 }}>{label}</span>
              {isFriday(dow) && status !== "holiday" && (
                <span style={{ fontSize:10, color:"#D97706", marginLeft:4 }}>· Half day (Friday)</span>
              )}
            </div>
          );
        })()}

        {/* Monthly summary */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6, marginTop:14 }}>
          {[
            { label:"Present",  val:counts.present,  color:"#15803D", bg:"#DCFCE7" },
            { label:"Absent",   val:counts.absent,   color:"#DC2626", bg:"#FEE2E2" },
            { label:"Late",     val:counts.late,     color:"#D97706", bg:"#FEF3C7" },
            { label:"Excused",  val:counts.excused,  color:"#7C3AED", bg:"#EDE9FE" },
            { label:"Holiday",  val:counts.holiday,  color:"#DC2626", bg:"#FEF2F2" },
            { label:"Rate",     val:rate !== null ? `${rate}%` : "—",
              color: rate !== null ? (rate >= 75 ? "#15803D" : "#DC2626") : "var(--text-3)",
              bg:"var(--canvas)" },
          ].map(item => (
            <div key={item.label} style={{ background:item.bg, borderRadius:8, padding:"8px 4px", textAlign:"center" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:item.color }}>
                {item.val}
              </div>
              <div style={{ fontSize:9, color:"var(--text-3)", fontWeight:600, marginTop:1,
                textTransform:"uppercase", letterSpacing:"0.05em" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Holiday names this month */}
        {(() => {
          const thisMonthHolidays = Object.entries(NEPAL_HOLIDAYS)
            .filter(([k]) => {
              const [y,m] = k.split("-").map(Number);
              return y === year && m === month;
            });
          const vacations = SCHOOL_VACATIONS.filter(([vy,vm]) => vy===year && vm===month);
          if (thisMonthHolidays.length === 0 && vacations.length === 0) return null;
          return (
            <div style={{ marginTop:12, padding:"10px 12px", background:"var(--canvas)", borderRadius:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase",
                letterSpacing:"0.06em", marginBottom:6 }}>Public Holidays & Vacations This Month</div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {thisMonthHolidays.map(([k,name]) => {
                  const d = parseInt(k.split("-")[2]);
                  return (
                    <div key={k} style={{ display:"flex", gap:8, alignItems:"center", fontSize:11 }}>
                      <span className="mono" style={{ color:"var(--blue)", fontWeight:700, minWidth:24 }}>{d}</span>
                      <span style={{ color:"var(--text-2)" }}>{name}</span>
                    </div>
                  );
                })}
                {vacations.map(([,, vs, ve, label]) => (
                  <div key={label} style={{ display:"flex", gap:8, alignItems:"center", fontSize:11 }}>
                    <span className="mono" style={{ color:"#DC2626", fontWeight:700, minWidth:24 }}>{vs}–{ve}</span>
                    <span style={{ color:"var(--text-2)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Legend pill ───────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
      {[
        ["P","Present","#15803D","#DCFCE7"],
        ["A","Absent","#DC2626","#FEE2E2"],
        ["L","Late","#D97706","#FEF3C7"],
        ["E","Excused","#7C3AED","#EDE9FE"],
        ["H","Holiday","#DC2626","#FEF2F2"],
        ["·","Future (no record)","var(--border)","transparent"],
      ].map(([badge, label, color, bg]) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-2)" }}>
          <div style={{ width:20, height:20, borderRadius:5, background:bg, color,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800 }}>
            {badge}
          </div>
          {label}
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#D97706" }}>
        <span style={{ fontSize:9, fontWeight:700 }}>½</span> Friday (half day)
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { currentUser } = useApp();
  const isParent  = currentUser?.role === "parent";
  const isTeacher = currentUser?.role === "teacher";
  const isAdmin   = currentUser?.role === "admin";

  // Navigation state — start at current month
  const [year,  setYear]  = useState(TODAY_BS.year);
  const [month, setMonth] = useState(TODAY_BS.month);

  // Teacher/admin daily marking
  const [selectedClass, setSelectedClass] = useState("10A");
  const [attendance,    setAttendance]    = useState({});
  const [view,          setView]          = useState("calendar"); // "daily" | "calendar"

  const handleMonthChange = (y, m) => { setYear(y); setMonth(m); };

  const classStudents = mockStudents.filter(s => s.class === selectedClass);
  const childStudent  = mockStudents.find(s => s.id === currentUser?.childId) || mockStudents[0];

  // Daily date — default to today, but capped; can't mark future
  const todayKey = `${TODAY_BS.year}-${String(TODAY_BS.month).padStart(2,"0")}-${String(TODAY_BS.day).padStart(2,"0")}`;
  const [markDate, setMarkDate] = useState(todayKey);

  const todayDow    = (getFirstDayOfMonth(TODAY_BS.year, TODAY_BS.month) + TODAY_BS.day - 1) % 7;
  const todayIsHol  = isHolidayDate(TODAY_BS.year, TODAY_BS.month, TODAY_BS.day);
  const todayIsVac  = isVacationDate(TODAY_BS.year, TODAY_BS.month, TODAY_BS.day);
  const schoolClosed = isSaturday(todayDow) || !!todayIsHol || !!todayIsVac;

  return (
    <>
      <Topbar title="Attendance"/>
      <div className="page-content">

        {/* ── Header ── */}
        <div className="page-header">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <h1 className="page-title">Attendance</h1>
              <p className="page-subtitle">
                {isParent ? "Your child's attendance — Academic Year 2082 BS"
                  : "Student attendance — Academic Year 2082 BS (Baisakh–Chaitra)"}
              </p>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <NepalClock/>
              {(isTeacher || isAdmin) && (
                <div style={{ display:"flex", gap:8 }}>
                  <button className={`btn btn-sm ${view==="calendar"?"btn-primary":"btn-outline"}`} onClick={()=>setView("calendar")}>Calendar</button>
                  <button className={`btn btn-sm ${view==="daily"?"btn-primary":"btn-outline"}`} onClick={()=>setView("daily")}>Mark Today</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Today alert if school closed ── */}
        {(isTeacher || isAdmin) && schoolClosed && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
            background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, marginBottom:16, fontSize:13 }}>
            <Info size={16} style={{ color:"#DC2626", flexShrink:0 }}/>
            <span style={{ color:"#DC2626", fontWeight:500 }}>
              Today is a {isSaturday(todayDow) ? "Saturday holiday" : (todayIsHol || todayIsVac)} — school is closed. No attendance required.
            </span>
          </div>
        )}

        {/* ── PARENT: their child's calendar ── */}
        {isParent && (
          <>
            <div style={{ marginBottom:12 }}><Legend/></div>
            <StudentCalendar
              student={childStudent}
              year={year} month={month}
              onMonthChange={handleMonthChange}
            />
          </>
        )}

        {/* ── TEACHER / ADMIN: Calendar view ── */}
        {(isTeacher || isAdmin) && view === "calendar" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
              <Legend/>
              <select className="form-input" style={{width:"auto"}} value={selectedClass}
                onChange={e=>setSelectedClass(e.target.value)}>
                {CLASSES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {classStudents.map(s => (
                <StudentCalendar key={s.id} student={s}
                  year={year} month={month}
                  onMonthChange={handleMonthChange}
                  compact
                />
              ))}
            </div>
          </>
        )}

        {/* ── TEACHER / ADMIN: Daily mark view ── */}
        {(isTeacher || isAdmin) && view === "daily" && (
          <>
            <div className="filter-bar" style={{ marginBottom:16 }}>
              <select className="form-input" style={{width:"auto"}} value={selectedClass}
                onChange={e=>setSelectedClass(e.target.value)}>
                {CLASSES.map(c=><option key={c}>{c}</option>)}
              </select>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:"var(--text-3)" }}>Date (BS):</span>
                <span className="mono" style={{ fontSize:13, fontWeight:600, color:"var(--text)",
                  background:"var(--canvas)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px" }}>
                  {TODAY_BS.day} {BS_MONTH_NAMES[TODAY_BS.month-1]} {TODAY_BS.year}
                </span>
                <span style={{ fontSize:11, color:"var(--text-3)" }}>(Today)</span>
              </div>
              <button className="btn btn-primary"
                onClick={() => toast.success(`Attendance saved for Class ${selectedClass} — ${TODAY_BS.day} ${BS_MONTH_NAMES[TODAY_BS.month-1]} ${TODAY_BS.year} BS`)}>
                <Save size={14}/> Save Attendance
              </button>
            </div>

            {schoolClosed ? (
              <div style={{ padding:"40px 24px", textAlign:"center", color:"var(--text-3)", background:"var(--canvas)", borderRadius:12 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🏖️</div>
                <div style={{ fontSize:15, fontWeight:600 }}>School is closed today</div>
                <div style={{ fontSize:13, marginTop:4 }}>{todayIsHol || todayIsVac || "Saturday Holiday"}</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Name</th>
                      {STATUS_OPTIONS.map(s => (
                        <th key={s} style={{ textAlign:"center" }}>
                          <span style={{ color: STATUS_COLOR[s] }}>{STATUS_FULL[s]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map(s => {
                      const status = attendance[s.id] || "present";
                      return (
                        <tr key={s.id}>
                          <td><span className="mono tag tag-gray">{s.rollNo}</span></td>
                          <td style={{ fontWeight:500 }}>{s.name}</td>
                          {STATUS_OPTIONS.map(opt => (
                            <td key={opt} style={{ textAlign:"center" }}>
                              <input type="radio" name={`att-${s.id}`}
                                checked={status===opt}
                                onChange={()=>setAttendance(p=>({...p,[s.id]:opt}))}
                                style={{ accentColor: STATUS_COLOR[opt], cursor:"pointer", width:16, height:16 }}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

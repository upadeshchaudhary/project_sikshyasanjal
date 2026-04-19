import { useState } from "react";
import Topbar from "../components/Topbar";
import { CLASSES } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { Lock } from "lucide-react";

// ─── Time schedule ─────────────────────────────────────────────────────────────
// School: 10:00 AM – 3:20 PM, 40 min periods, lunch after period 4
// Sun–Thu: 7 teaching periods + 1 lunch = 8 rows
// Friday:  4 teaching periods only (10:00–12:40)
//
// Period times:
//  P1  10:00 – 10:40
//  P2  10:40 – 11:20
//  P3  11:20 – 12:00
//  P4  12:00 – 12:40
//  LUNCH 12:40 – 13:20 (40 min)
//  P5  13:20 – 14:00
//  P6  14:00 – 14:40
//  P7  14:40 – 15:20

const PERIOD_TIMES = [
  { key: "P1",    label: "Period 1",   time: "10:00 – 10:40" },
  { key: "P2",    label: "Period 2",   time: "10:40 – 11:20" },
  { key: "P3",    label: "Period 3",   time: "11:20 – 12:00" },
  { key: "P4",    label: "Period 4",   time: "12:00 – 12:40" },
  { key: "LUNCH", label: "Lunch",      time: "12:40 – 13:20" },
  { key: "P5",    label: "Period 5",   time: "13:20 – 14:00" },
  { key: "P6",    label: "Period 6",   time: "14:00 – 14:40" },
  { key: "P7",    label: "Period 7",   time: "14:40 – 15:20" },
];

// Saturday periods (4 only)
const SAT_PERIOD_TIMES = [
  { key: "P1", label: "Period 1", time: "10:00 – 10:40" },
  { key: "P2", label: "Period 2", time: "10:40 – 11:20" },
  { key: "P3", label: "Period 3", time: "11:20 – 12:00" },
  { key: "P4", label: "Period 4", time: "12:00 – 12:40" },
];

const DAYS     = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
const ALL_DAYS = [...DAYS, "Friday"];

// ─── Subject colors ───────────────────────────────────────────────────────────
const SUBJECT_COLORS = {
  "Mathematics":          { bg:"#EEF1FE", color:"#1E3FF2" },
  "Optional Mathematics": { bg:"#E0E7FF", color:"#4338CA" },
  "Science":              { bg:"#DCFCE7", color:"#15803D" },
  "Nepali":               { bg:"#FEF3C7", color:"#D97706" },
  "English":              { bg:"#EDE9FE", color:"#7C3AED" },
  "Social Studies":       { bg:"#FEE2E2", color:"#DC2626" },
  "Computer Science":     { bg:"#ECFDF5", color:"#059669" },
  "Health & PE":          { bg:"#FFF7ED", color:"#EA580C" },
  "Lunch":                { bg:"var(--amber-pale)", color:"var(--amber)" },
};

const getColor = (subject) => SUBJECT_COLORS[subject] || { bg:"var(--canvas)", color:"var(--text-2)" };

// ─── Schedule data ────────────────────────────────────────────────────────────
// 8 subjects per class (7 per day + lunch + saturday 4)
// Classes 9 & 10: Computer Science replaces HP in some slots, Optional Math added

const SCHEDULES = {
  // ── Class 10A ──────────────────────────────────────────────────────────────
  "10A": {
    Sunday:    ["Mathematics","English","Science","Nepali",null,"Social Studies","Optional Mathematics","Computer Science"],
    Monday:    ["English","Mathematics","Social Studies","Computer Science",null,"Nepali","Science","Optional Mathematics"],
    Tuesday:   ["Science","Nepali","Mathematics","English",null,"Computer Science","Social Studies","Mathematics"],
    Wednesday: ["Nepali","Social Studies","English","Mathematics",null,"Science","Optional Mathematics","English"],
    Thursday:  ["Computer Science","Mathematics","Nepali","Science",null,"English","Mathematics","Social Studies"],
    Friday:    ["Social Studies","Science","Optional Mathematics","Mathematics",null,null,null,null],
  },
  // ── Class 10B ──────────────────────────────────────────────────────────────
  "10B": {
    Sunday:    ["English","Science","Mathematics","Optional Mathematics",null,"Nepali","Computer Science","Social Studies"],
    Monday:    ["Nepali","Mathematics","Computer Science","English",null,"Science","Social Studies","Mathematics"],
    Tuesday:   ["Mathematics","Optional Mathematics","Nepali","Science",null,"English","Mathematics","Computer Science"],
    Wednesday: ["Science","Computer Science","Social Studies","Mathematics",null,"Optional Mathematics","English","Nepali"],
    Thursday:  ["Social Studies","Nepali","English","Computer Science",null,"Mathematics","Science","Optional Mathematics"],
    Friday:    ["Computer Science","English","Science","Nepali",null,null,null,null],
  },
  // ── Class 9A ───────────────────────────────────────────────────────────────
  "9A": {
    Sunday:    ["Mathematics","Science","Nepali","English",null,"Social Studies","Computer Science","Optional Mathematics"],
    Monday:    ["Computer Science","Mathematics","English","Social Studies",null,"Science","Nepali","Mathematics"],
    Tuesday:   ["English","Nepali","Mathematics","Computer Science",null,"Optional Mathematics","Science","Social Studies"],
    Wednesday: ["Social Studies","English","Science","Mathematics",null,"Nepali","Optional Mathematics","Computer Science"],
    Thursday:  ["Nepali","Optional Mathematics","Social Studies","Science",null,"Mathematics","English","Nepali"],
    Friday:    ["Science","Social Studies","Optional Mathematics","Nepali",null,null,null,null],
  },
  // ── Class 9B ───────────────────────────────────────────────────────────────
  "9B": {
    Sunday:    ["Nepali","Mathematics","Computer Science","Science",null,"English","Optional Mathematics","Social Studies"],
    Monday:    ["Science","English","Nepali","Optional Mathematics",null,"Mathematics","Computer Science","Science"],
    Tuesday:   ["Optional Mathematics","Social Studies","English","Mathematics",null,"Nepali","Science","Computer Science"],
    Wednesday: ["Mathematics","Computer Science","Social Studies","Nepali",null,"Science","English","Optional Mathematics"],
    Thursday:  ["English","Nepali","Mathematics","Computer Science",null,"Social Studies","Mathematics","Science"],
    Friday:    ["Social Studies","Science","English","Mathematics",null,null,null,null],
  },
  // ── Class 8A ───────────────────────────────────────────────────────────────
  "8A": {
    Sunday:    ["Mathematics","Nepali","English","Science",null,"Social Studies","Health & PE","Mathematics"],
    Monday:    ["English","Mathematics","Social Studies","Health & PE",null,"Nepali","Science","English"],
    Tuesday:   ["Science","English","Mathematics","Nepali",null,"Health & PE","Social Studies","Science"],
    Wednesday: ["Nepali","Social Studies","Health & PE","Mathematics",null,"English","Mathematics","Nepali"],
    Thursday:  ["Social Studies","Health & PE","Nepali","English",null,"Mathematics","English","Social Studies"],
    Friday:    ["Health & PE","Science","Social Studies","Mathematics",null,null,null,null],
  },
  // ── Class 8B ───────────────────────────────────────────────────────────────
  "8B": {
    Sunday:    ["English","Science","Nepali","Mathematics",null,"Health & PE","Social Studies","Science"],
    Monday:    ["Nepali","English","Science","Social Studies",null,"Mathematics","Health & PE","English"],
    Tuesday:   ["Social Studies","Mathematics","Health & PE","English",null,"Nepali","Mathematics","Social Studies"],
    Wednesday: ["Health & PE","Nepali","Mathematics","Science",null,"English","Nepali","Health & PE"],
    Thursday:  ["Mathematics","Social Studies","English","Health & PE",null,"Science","English","Mathematics"],
    Friday:    ["Science","Health & PE","Social Studies","Nepali",null,null,null,null],
  },
  // ── Class 7A ───────────────────────────────────────────────────────────────
  "7A": {
    Sunday:    ["Mathematics","English","Nepali","Science",null,"Social Studies","Health & PE","Mathematics"],
    Monday:    ["Nepali","Mathematics","Social Studies","English",null,"Science","Mathematics","Nepali"],
    Tuesday:   ["Science","Nepali","Mathematics","Social Studies",null,"English","Nepali","Health & PE"],
    Wednesday: ["English","Science","Health & PE","Mathematics",null,"Nepali","Science","English"],
    Thursday:  ["Social Studies","Health & PE","English","Nepali",null,"Mathematics","Social Studies","Science"],
    Friday:    ["Health & PE","Social Studies","Science","English",null,null,null,null],
  },
  // ── Class 7B ───────────────────────────────────────────────────────────────
  "7B": {
    Sunday:    ["Nepali","Mathematics","Health & PE","English",null,"Science","Social Studies","Nepali"],
    Monday:    ["English","Nepali","Science","Mathematics",null,"Social Studies","Health & PE","Mathematics"],
    Tuesday:   ["Mathematics","Social Studies","English","Health & PE",null,"Nepali","Mathematics","Science"],
    Wednesday: ["Science","English","Mathematics","Nepali",null,"Health & PE","English","Social Studies"],
    Thursday:  ["Health & PE","Science","Social Studies","Mathematics",null,"English","Nepali","Health & PE"],
    Friday:    ["Social Studies","Health & PE","Nepali","Science",null,null,null,null],
  },
};

// ─── Teachers per subject (simplified) ───────────────────────────────────────
const SUBJECT_TEACHERS = {
  "Mathematics":          "Sunita Koirala",
  "Optional Mathematics": "Sunita Koirala",
  "Science":              "Ramesh Dhakal",
  "Nepali":               "Meena Shrestha",
  "English":              "Prakash Adhikari",
  "Social Studies":       "Kamala Thapa",
  "Computer Science":     "Rajan Shrestha",
  "Health & PE":          "Binod Gurung",
};

// ─── Room assignments ─────────────────────────────────────────────────────────
const CLASS_ROOMS = {
  "10A":"Room 201","10B":"Room 202","9A":"Room 301","9B":"Room 302",
  "8A":"Room 101","8B":"Room 102","7A":"Room 103","7B":"Room 104",
};

// ─── Subject legend ───────────────────────────────────────────────────────────
const LEGEND_SUBJECTS = [
  "Mathematics","Optional Mathematics","Science","Nepali",
  "English","Social Studies","Computer Science","Health & PE",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RoutinePage() {
  const { currentUser } = useApp();
  const isParent  = currentUser?.role === "parent";
  const isTeacher = currentUser?.role === "teacher";
  const isAdmin   = currentUser?.role === "admin";

  // Parent: locked to child's class. Teacher: defaults to first assigned class.
  // Admin: free to choose any class.
  const defaultClass = isParent
    ? (currentUser?.childClass || "10A")
    : isTeacher
    ? (currentUser?.class || "10A")
    : "10A";

  const [selectedClass, setSelectedClass] = useState(defaultClass);
  const [activeDay,     setActiveDay]     = useState("All");

  const schedule   = SCHEDULES[selectedClass] || SCHEDULES["10A"];
  const room       = CLASS_ROOMS[selectedClass] || "Room 201";
  const isHigher   = ["9A","9B","10A","10B"].includes(selectedClass);

  const displayDays = activeDay === "All" ? ALL_DAYS : [activeDay];

  // Build cell for a given day and period index
  const getCell = (day, periodIdx) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return null;
    return daySchedule[periodIdx] || null;
  };

  // For Friday, only P1–P4 are active (indices 0–3)
  const isFridayPeriod = (day, periodIdx) => day === "Friday" && periodIdx >= 4;

  return (
    <>
      <Topbar title="Class Routine"/>
      <div className="page-content">

        {/* ── Header ── */}
        <div className="page-header">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <h1 className="page-title">Class Routine</h1>
              <p className="page-subtitle">
                Weekly timetable · 10:00 AM – 3:20 PM · 7 periods/day (Sun–Thu) · 4 periods on Friday
              </p>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              {/* Parents see a locked badge — no choice */}
              {isParent ? (
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
                  background:"var(--canvas)", border:"1px solid var(--border)", borderRadius:8,
                  fontSize:13, fontWeight:500 }}>
                  <Lock size={12} style={{ opacity:0.4 }}/>
                  Class {selectedClass}
                  <span style={{ fontSize:10, color:"var(--text-3)", marginLeft:4 }}>(your child's class)</span>
                </div>
              ) : (
                /* Teachers and admin get the dropdown */
                <select
                  className="form-input"
                  style={{ width:"auto" }}
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                >
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ── Day filter tabs ── */}
        <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>
          {["All", ...ALL_DAYS].map(d => (
            <button
              key={d}
              className={`btn btn-sm ${activeDay===d ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveDay(d)}
            >
              {d === "Friday" ? "Fri (4 periods)" : d}
            </button>
          ))}
        </div>

        {/* ── School info bar ── */}
        <div style={{
          display:"flex", gap:20, flexWrap:"wrap", marginBottom:16,
          padding:"10px 16px", background:"var(--card)", borderRadius:10,
          border:"1px solid var(--border)", fontSize:12, color:"var(--text-2)",
        }}>
          <span>🏫 <strong>Class:</strong> {selectedClass}</span>
          <span>📍 <strong>Room:</strong> {room}</span>
          <span>⏰ <strong>Start:</strong> 10:00 AM</span>
          <span>⏰ <strong>End:</strong> 3:20 PM</span>
          <span>📚 <strong>Subjects:</strong> {isHigher ? "8 (inc. Computer & Opt. Math)" : "7"}</span>
          <span>📅 <strong>Saturday:</strong> 4 periods only</span>
        </div>

        {/* ── Timetable ── */}
        <div style={{ overflowX:"auto" }}>
          <table className="routine-table" style={{
            borderRadius:12, overflow:"hidden",
            boxShadow:"var(--shadow)", border:"1px solid var(--border)",
            minWidth: displayDays.length > 1 ? 900 : 400,
          }}>
            <thead>
              <tr>
                <th style={{ background:"var(--text)", minWidth:120, textAlign:"left", padding:"10px 14px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>TIME</div>
                </th>
                {displayDays.map(d => (
                  <th key={d} style={{
                    minWidth:130, background: d==="Friday" ? "#7C3AED" : "var(--blue)",
                    padding:"10px 12px",
                  }}>
                    <div>{d}</div>
                    {d === "Friday" && (
                      <div style={{ fontSize:9, fontWeight:400, opacity:0.75, marginTop:2 }}>4 periods · Half day</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIOD_TIMES.map((row, periodIdx) => {
                const isLunch = row.key === "LUNCH";
                return (
                  <tr key={row.key}>
                    {/* Time column */}
                    <td className="period-label" style={{ padding:"10px 14px", textAlign:"left", background:"var(--canvas)" }}>
                      <div style={{
                        fontFamily:"'JetBrains Mono',monospace",
                        fontSize:11, fontWeight:700, color:"var(--text)",
                      }}>
                        {isLunch ? "🍱 Lunch" : row.label}
                      </div>
                      <div style={{ fontSize:10, color:"var(--text-3)", marginTop:1 }}>{row.time}</div>
                    </td>

                    {/* Day cells */}
                    {displayDays.map(day => {
                      if (isLunch) {
                        return (
                          <td key={day} className="routine-break" style={{ padding:"10px 8px", fontSize:12 }}>
                            {day === "Friday" ? (
                              <span style={{ fontSize:11, color:"var(--text-3)", fontStyle:"italic" }}>—</span>
                            ) : "☕ Lunch Break · 12:40 – 13:20"}
                          </td>
                        );
                      }

                      // Saturday only has P1–P4
                      if (isFridayPeriod(day, periodIdx)) {
                        return (
                          <td key={day} style={{
                            background:"rgba(139,92,246,0.06)",
                            textAlign:"center", color:"var(--text-3)",
                            fontSize:11, fontStyle:"italic", padding:"10px 6px",
                          }}>
                            —
                          </td>
                        );
                      }

                      const subject = getCell(day, periodIdx > 4 ? periodIdx - 1 : periodIdx);
                      // Adjust index: periods after lunch shift by 1 (skip lunch slot in data array)
                      const dataIdx = periodIdx >= 5 ? periodIdx - 1 : periodIdx;
                      const subj    = schedule[day]?.[dataIdx] || null;

                      if (!subj) {
                        return <td key={day} style={{ background:"var(--canvas)", textAlign:"center", color:"var(--text-3)", fontSize:11 }}>—</td>;
                      }

                      const { bg, color } = getColor(subj);
                      const teacher       = SUBJECT_TEACHERS[subj] || "";

                      return (
                        <td key={day} style={{ background:"var(--card)", padding:"4px 6px" }}>
                          <div style={{
                            background:bg, borderRadius:7, padding:"8px 10px",
                            borderLeft:`3px solid ${color}`,
                          }}>
                            <div style={{ fontSize:12, fontWeight:700, color, lineHeight:1.2 }}>{subj}</div>
                            {teacher && (
                              <div style={{ fontSize:10, color:"var(--text-3)", marginTop:3 }}>{teacher}</div>
                            )}
                            <div style={{ fontSize:9, color:"var(--text-3)", marginTop:1, fontFamily:"'JetBrains Mono',monospace" }}>
                              {room}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Subject legend ── */}
        <div style={{ marginTop:20, display:"flex", gap:8, flexWrap:"wrap" }}>
          {LEGEND_SUBJECTS.filter(s => isHigher || !["Optional Mathematics","Computer Science"].includes(s)).map(sub => {
            const { bg, color } = getColor(sub);
            return (
              <div key={sub} style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"4px 10px", borderRadius:100,
                background:bg, fontSize:11, fontWeight:500, color,
              }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:color }}/>
                {sub}
              </div>
            );
          })}
        </div>

        {/* ── Schedule summary ── */}
        <div style={{
          marginTop:16, padding:"14px 18px",
          background:"var(--card)", borderRadius:10,
          border:"1px solid var(--border)", fontSize:12, color:"var(--text-2)",
          display:"flex", gap:24, flexWrap:"wrap",
        }}>
          <div><strong style={{color:"var(--text)"}}>School Hours:</strong> 10:00 AM – 3:20 PM</div>
          <div><strong style={{color:"var(--text)"}}>Period Length:</strong> 40 minutes</div>
          <div><strong style={{color:"var(--text)"}}>Lunch Break:</strong> 12:40 – 13:20 (40 min)</div>
          <div><strong style={{color:"var(--text)"}}>Weekdays:</strong> Sunday – Thursday (7 periods)</div>
          <div><strong style={{color:"var(--text)"}}>Friday:</strong> 4 periods · Half day</div>
          {isHigher && <div><strong style={{color:"var(--blue)"}}>Gr. 9–10:</strong> Computer Science + Optional Mathematics added</div>}
        </div>
      </div>
    </>
  );
}

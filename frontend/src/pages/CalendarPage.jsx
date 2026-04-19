import { useState } from "react";
import Topbar from "../components/Topbar";
import { mockCalendarEvents } from "../data/mockData";
import {
  BS_MONTH_NAMES,
  formatBSDate,
  getDaysInBSMonth,
  getFirstWeekdayOfBSMonth,
  getADMonthLabel,
} from "../utils/calendar";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  holiday:  { tag: "tag-red",    bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  festival: { tag: "tag-red",    bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" },
  exam:     { tag: "tag-blue",   bg: "#eef1fe", text: "#1e3ff2", dot: "#1e3ff2" },
  event:    { tag: "tag-purple", bg: "#ede9fe", text: "#7c3aed", dot: "#8b5cf6" },
  meeting:  { tag: "tag-amber",  bg: "#fef3c7", text: "#d97706", dot: "#f59e0b" },
};

const TYPE_ICONS = {
  holiday:  "🌿",
  festival: "🪔",
  exam:     "📝",
  event:    "🎉",
  meeting:  "🤝",
};

const YEARS = [2079,2080,2081,2082,2083,2084,2085,2086,2087,2088,2089,2090,2091];

// Today in BS — approximate. 2082 Magh 25 ≈ March 10 2026 AD
const TODAY_BS = { year: 2082, month: 10, day: 25 };

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { currentUser } = useApp();
  const isReadOnly = currentUser?.role !== "admin";

  const [events, setEvents]           = useState(mockCalendarEvents);
  const [showModal, setShowModal]     = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // { bsDate, dayEvents }
  const [form, setForm]               = useState({ title:"", bsDate:"", type:"event", description:"" });
  const [selectedYear, setSelectedYear]   = useState(TODAY_BS.year);
  const [selectedMonth, setSelectedMonth] = useState(TODAY_BS.month);

  // ── Derived data ──────────────────────────────────────────────────────────

  const monthEvents = events
    .filter(e => {
      const [y, m] = e.bsDate.split("-").map(Number);
      return y === selectedYear && m === selectedMonth;
    })
    .sort((a, b) => a.bsDate.localeCompare(b.bsDate));

  const upcomingEvents = events
    .filter(e => e.bsDate >= `${TODAY_BS.year}-${String(TODAY_BS.month).padStart(2,"0")}-${String(TODAY_BS.day).padStart(2,"0")}`)
    .sort((a, b) => a.bsDate.localeCompare(b.bsDate))
    .slice(0, 8);

  const daysInMonth    = getDaysInBSMonth(selectedYear, selectedMonth);
  const firstWeekday   = getFirstWeekdayOfBSMonth(selectedYear, selectedMonth);
  const adMonthLabel   = getADMonthLabel(selectedYear, selectedMonth);

  // ── Navigation helpers ────────────────────────────────────────────────────

  const prevMonth = () => {
    if (selectedMonth === 1) {
      const prevYear = selectedYear - 1;
      if (YEARS.includes(prevYear)) { setSelectedYear(prevYear); setSelectedMonth(12); }
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      const nextYear = selectedYear + 1;
      if (YEARS.includes(nextYear)) { setSelectedYear(nextYear); setSelectedMonth(1); }
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleDayClick = (dayNum, dayEvents) => {
    if (!dayEvents.length) return;
    const mm = String(selectedMonth).padStart(2,"0");
    const dd = String(dayNum).padStart(2,"0");
    setSelectedDay({ bsDate: `${selectedYear}-${mm}-${dd}`, dayEvents });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    setEvents(prev => [...prev, { ...form, id: "c" + Date.now() }]);
    toast.success("Event added!");
    setShowModal(false);
    setForm({ title:"", bsDate:"", type:"event", description:"" });
  };

  const handleDelete = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("Event removed");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar title="Academic Calendar" />
      <div className="page-content">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h1 className="page-title">Academic Calendar</h1>
              <p className="page-subtitle">
                Bikram Sambat {selectedYear} &nbsp;·&nbsp; {adMonthLabel}
              </p>
            </div>
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={15} /> Add Event
              </button>
            )}
          </div>
        </div>

        {/* ── Year Tabs ── */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"var(--text-3)", letterSpacing:"0.08em", flexShrink:0 }}>
            YEAR
          </span>
          {YEARS.map(y => (
            <button
              key={y}
              className={`btn btn-sm ${selectedYear === y ? "btn-primary" : "btn-outline"}`}
              onClick={() => setSelectedYear(y)}
              style={{ fontFamily:"'JetBrains Mono',monospace", minWidth:50, flexShrink:0 }}
            >
              {y}
            </button>
          ))}
        </div>

        {/* ── Month Tabs ── */}
        <div style={{ display:"flex", gap:6, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
          {BS_MONTH_NAMES.map((m, i) => (
            <button
              key={m}
              className={`btn btn-sm ${selectedMonth === i+1 ? "btn-primary" : "btn-outline"}`}
              onClick={() => setSelectedMonth(i+1)}
              style={{ whiteSpace:"nowrap", flexShrink:0 }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid-2">

          {/* ── Left: Calendar Grid ── */}
          <div>
            <div className="card" style={{ marginBottom:20 }}>

              {/* Calendar Header */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"16px 20px 12px", borderBottom:"1px solid var(--border)"
              }}>
                <button className="btn btn-ghost btn-sm" onClick={prevMonth} style={{ padding:"6px 8px" }}>
                  <ChevronLeft size={16} />
                </button>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontWeight:700, fontSize:15, color:"var(--text)" }}>
                    {BS_MONTH_NAMES[selectedMonth-1]} {selectedYear}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-3)", marginTop:2 }}>
                    {adMonthLabel}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={nextMonth} style={{ padding:"6px 8px" }}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day grid */}
              <div style={{ padding:"16px 16px 8px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>

                  {/* Weekday headers */}
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <div key={d} style={{
                      textAlign:"center", fontSize:11, fontWeight:700, paddingBottom:6,
                      color: d === "Sa" ? "#ef4444" : "var(--text-2)",
                      letterSpacing:"0.04em",
                    }}>
                      {d}
                    </div>
                  ))}

                  {/* Empty offset cells */}
                  {Array.from({ length: firstWeekday }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNum    = i + 1;
                    const mm        = String(selectedMonth).padStart(2,"0");
                    const dd        = String(dayNum).padStart(2,"0");
                    const bsKey     = `${selectedYear}-${mm}-${dd}`;
                    const colIndex  = (firstWeekday + i) % 7;
                    const isSat     = colIndex === 6;
                    const dayEvents = events.filter(e => e.bsDate === bsKey);
                    const isHoliday = dayEvents.some(e => e.type === "holiday" || e.type === "festival");
                    const hasExam   = dayEvents.some(e => e.type === "exam");
                    const hasEvent  = dayEvents.some(e => e.type === "event" || e.type === "meeting");
                    const isToday   = selectedYear === TODAY_BS.year
                                   && selectedMonth === TODAY_BS.month
                                   && dayNum === TODAY_BS.day;
                    const hasAny    = dayEvents.length > 0;

                    // Background / color logic (priority: today > holiday > saturday)
                    let cellBg   = "transparent";
                    let cellText = "var(--text)";
                    if (isToday)        { cellBg = "var(--blue)"; cellText = "#fff"; }
                    else if (isHoliday) { cellBg = "#fee2e2";     cellText = "#dc2626"; }
                    else if (isSat)     { cellText = "#ef4444"; }

                    return (
                      <div
                        key={bsKey}
                        onClick={() => handleDayClick(dayNum, dayEvents)}
                        title={
                          dayEvents.length
                            ? dayEvents.map(e => e.title).join(" · ")
                            : isSat ? "Saturday — Weekly Off" : ""
                        }
                        style={{
                          aspectRatio:"1",
                          display:"flex", flexDirection:"column",
                          alignItems:"center", justifyContent:"center",
                          borderRadius:8,
                          background: cellBg,
                          color: cellText,
                          cursor: hasAny ? "pointer" : "default",
                          fontFamily:"'JetBrains Mono',monospace",
                          fontSize:12,
                          fontWeight: isToday ? 700 : 400,
                          position:"relative",
                          transition:"background 0.1s, transform 0.1s",
                          boxShadow: isToday ? "0 2px 10px rgba(30,63,242,0.35)" : "none",
                          border: isToday ? "none" : hasAny ? "1px solid transparent" : "1px solid transparent",
                          outline: selectedDay?.bsDate === bsKey ? "2px solid var(--blue)" : "none",
                        }}
                        onMouseEnter={e => {
                          if (!isToday) {
                            e.currentTarget.style.background = isHoliday
                              ? "#fecaca"
                              : isSat
                              ? "#fff1f1"
                              : "var(--canvas)";
                            if (hasAny) e.currentTarget.style.transform = "scale(1.08)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isToday) {
                            e.currentTarget.style.background = cellBg;
                            e.currentTarget.style.transform = "scale(1)";
                          }
                        }}
                      >
                        {dayNum}

                        {/* Event indicator dots */}
                        {!isToday && (isHoliday || hasExam || hasEvent) && (
                          <div style={{ display:"flex", gap:2, marginTop:2 }}>
                            {isHoliday && (
                              <span style={{ width:4, height:4, borderRadius:"50%", background:"#dc2626" }} />
                            )}
                            {hasExam && (
                              <span style={{ width:4, height:4, borderRadius:"50%", background:"var(--blue)" }} />
                            )}
                            {hasEvent && (
                              <span style={{ width:4, height:4, borderRadius:"50%", background:"var(--amber)" }} />
                            )}
                          </div>
                        )}

                        {/* Saturday label under number */}
                        {isSat && !isHoliday && !isToday && (
                          <div style={{ fontSize:8, color:"#ef4444", marginTop:1, letterSpacing:"0.02em" }}>OFF</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div style={{
                padding:"10px 20px 14px",
                borderTop:"1px solid var(--border)",
                display:"flex", gap:14, flexWrap:"wrap", fontSize:11, color:"var(--text-2)"
              }}>
                {[
                  { color:"var(--blue)",  label:"Today" },
                  { color:"#fee2e2", border:"1px solid #fca5a5", label:"Holiday", textColor:"#dc2626" },
                  { color:"#ef4444",  label:"Sat (Off)", isText:true },
                ].map(l => (
                  <span key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {l.isText
                      ? <span style={{ fontWeight:700, color:l.color, fontSize:11 }}>Sa</span>
                      : <span style={{ width:10, height:10, borderRadius:3, background:l.color, border:l.border||"none", display:"inline-block" }} />
                    }
                    {l.label}
                  </span>
                ))}
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"#dc2626", display:"inline-block" }} />
                  Holiday dot
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"var(--blue)", display:"inline-block" }} />
                  Exam
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"var(--amber)", display:"inline-block" }} />
                  Event / Meeting
                </span>
              </div>
            </div>

            {/* ── Day detail popup (shown when a day with events is clicked) ── */}
            {selectedDay && (
              <div className="card" style={{ marginBottom:20, borderLeft:"3px solid var(--blue)" }}>
                <div className="card-header" style={{ paddingBottom:8 }}>
                  <div className="card-title" style={{ fontSize:13 }}>
                    {formatBSDate(selectedDay.bsDate)}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedDay(null)}
                    style={{ padding:"4px 6px" }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="card-body" style={{ paddingTop:4 }}>
                  {selectedDay.dayEvents.map(ev => {
                    const tc = TYPE_COLORS[ev.type] || TYPE_COLORS.event;
                    return (
                      <div key={ev.id} style={{
                        display:"flex", gap:10, padding:"8px 10px", borderRadius:8,
                        background: tc.bg, marginBottom:6,
                      }}>
                        <span style={{ fontSize:16 }}>{TYPE_ICONS[ev.type]}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:13, color: tc.text }}>{ev.title}</div>
                          {ev.description && (
                            <div style={{ fontSize:11, color:"var(--text-2)", marginTop:2 }}>{ev.description}</div>
                          )}
                        </div>
                        <span className={`tag ${tc.tag}`} style={{ alignSelf:"flex-start" }}>{ev.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Panels ── */}
          <div>

            {/* Events this month */}
            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-header">
                <div className="card-title">Events this month</div>
                <span className="tag tag-blue" style={{ fontSize:11 }}>
                  {monthEvents.length}
                </span>
              </div>
              <div className="card-body" style={{ padding:"8px 20px 16px", maxHeight:340, overflowY:"auto" }}>
                {monthEvents.length === 0 ? (
                  <div style={{ color:"var(--text-2)", fontSize:13, textAlign:"center", padding:"20px 0" }}>
                    No events this month
                  </div>
                ) : monthEvents.map(ev => {
                  const tc = TYPE_COLORS[ev.type] || TYPE_COLORS.event;
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display:"flex", gap:10, padding:"10px 0",
                        borderBottom:"1px solid var(--border)", alignItems:"flex-start",
                      }}
                    >
                      <span style={{
                        fontSize:18, width:32, height:32, borderRadius:8,
                        background: tc.bg, display:"flex", alignItems:"center",
                        justifyContent:"center", flexShrink:0,
                      }}>
                        {TYPE_ICONS[ev.type]}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, color: tc.text }}>{ev.title}</div>
                        <div style={{ fontSize:11, color:"var(--text-2)", marginTop:2 }}>
                          {formatBSDate(ev.bsDate)}
                        </div>
                        {ev.description && (
                          <div style={{
                            fontSize:11, color:"var(--text-2)", marginTop:2,
                            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                          }}>
                            {ev.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                        <span className={`tag ${tc.tag}`} style={{ flexShrink:0 }}>{ev.type}</span>
                        {!isReadOnly && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding:"2px 4px", color:"var(--text-3)" }}
                            onClick={() => handleDelete(ev.id)}
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming events across all years */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Upcoming Events</div>
                <span style={{ fontSize:11, color:"var(--text-3)" }}>from today</span>
              </div>
              <div className="card-body" style={{ padding:"8px 20px 16px", maxHeight:320, overflowY:"auto" }}>
                {upcomingEvents.length === 0 ? (
                  <div style={{ color:"var(--text-2)", fontSize:13, textAlign:"center", padding:"20px 0" }}>
                    No upcoming events
                  </div>
                ) : upcomingEvents.map(ev => {
                  const tc = TYPE_COLORS[ev.type] || TYPE_COLORS.event;
                  return (
                    <div
                      key={ev.id}
                      style={{
                        display:"flex", gap:10, padding:"9px 0",
                        borderBottom:"1px solid var(--border)", alignItems:"center",
                        cursor:"pointer",
                      }}
                      onClick={() => {
                        const [y, m] = ev.bsDate.split("-").map(Number);
                        setSelectedYear(y);
                        setSelectedMonth(m);
                      }}
                    >
                      <span style={{ fontSize:16, flexShrink:0 }}>{TYPE_ICONS[ev.type]}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:500, fontSize:13, color:"var(--text)" }}>{ev.title}</div>
                        <div style={{ fontSize:11, color:"var(--text-3)", marginTop:1 }} className="mono">
                          {ev.bsDate} BS
                        </div>
                      </div>
                      <span className={`tag ${tc.tag}`} style={{ flexShrink:0 }}>{ev.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Add Event Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Calendar Event</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input
                    className="form-input" required
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">BS Date (YYYY-MM-DD)</label>
                    <input
                      className="form-input mono" required
                      placeholder={`${selectedYear}-${String(selectedMonth).padStart(2,"0")}-01`}
                      value={form.bsDate}
                      onChange={e => setForm(p => ({ ...p, bsDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      className="form-input"
                      value={form.type}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    >
                      <option value="holiday">Holiday</option>
                      <option value="festival">Festival</option>
                      <option value="exam">Exam</option>
                      <option value="event">Event</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input" rows={3}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
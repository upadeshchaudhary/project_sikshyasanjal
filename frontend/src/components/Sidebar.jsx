import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, BarChart2, Calendar, CalendarDays,
  Bell, CreditCard, MessageSquare, LogOut, School,
} from "lucide-react";

// ─── Navigation per role — labels match PRD exactly ──────────────────────────
const adminNav = [
  { label: "Overview", items: [
    { path: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  ]},
  { label: "People", items: [
    { path: "/students",   icon: Users,           label: "Student Management" },
    { path: "/teachers",   icon: GraduationCap,   label: "Teacher Management" },
  ]},
  { label: "Academics", items: [
    { path: "/homework",   icon: BookOpen,        label: "Homework" },
    { path: "/attendance", icon: ClipboardList,   label: "Attendance" },
    { path: "/results",    icon: BarChart2,       label: "Exam Results" },
    { path: "/routine",    icon: CalendarDays,    label: "Class Routine" },
    { path: "/calendar",   icon: Calendar,        label: "Academic Calendar" },
  ]},
  { label: "Administration", items: [
    { path: "/notices",    icon: Bell,            label: "Notices" },
    { path: "/fees",       icon: CreditCard,      label: "Fee Tracking" },
    { path: "/messages",   icon: MessageSquare,   label: "Messaging" },
  ]},
];

const teacherNav = [
  { label: "Overview", items: [
    { path: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  ]},
  { label: "My Classes", items: [
    { path: "/students",   icon: Users,           label: "Students" },
    { path: "/homework",   icon: BookOpen,        label: "Homework" },
    { path: "/attendance", icon: ClipboardList,   label: "Attendance" },
    { path: "/results",    icon: BarChart2,       label: "Exam Results" },
    { path: "/routine",    icon: CalendarDays,    label: "Class Routine" },
  ]},
  { label: "School", items: [
    { path: "/notices",    icon: Bell,            label: "Notices" },
    { path: "/calendar",   icon: Calendar,        label: "Academic Calendar" },
    { path: "/messages",   icon: MessageSquare,   label: "Messaging" },
  ]},
];

const parentNav = [
  { label: "My Child", items: [
    { path: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
    { path: "/attendance", icon: ClipboardList,   label: "Attendance" },
    { path: "/homework",   icon: BookOpen,        label: "Homework" },
    { path: "/results",    icon: BarChart2,       label: "Exam Results" },
    { path: "/routine",    icon: CalendarDays,    label: "Class Routine" },
    { path: "/fees",       icon: CreditCard,      label: "Fee Status" },
  ]},
  { label: "School", items: [
    { path: "/notices",    icon: Bell,            label: "Notices" },
    { path: "/calendar",   icon: Calendar,        label: "Academic Calendar" },
    { path: "/messages",   icon: MessageSquare,   label: "Messaging" },
  ]},
];

const navByRole = { admin: adminNav, teacher: teacherNav, parent: parentNav };

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { currentUser, school, logout } = useApp();
  const navigate = useNavigate();
  const nav = navByRole[currentUser?.role] || adminNav;

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const initials = currentUser?.name
    ?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  // School name split into two lines for long names
  const schoolName = school?.name || "School";
  const schoolWords = schoolName.split(" ");
  const schoolLine1 = schoolWords.slice(0, Math.ceil(schoolWords.length / 2)).join(" ");
  const schoolLine2 = schoolWords.slice(Math.ceil(schoolWords.length / 2)).join(" ");

  return (
    <div className="sidebar">

      {/* ── Sidebar header ── */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          {/* School icon */}
          <div style={{
            width: 36, height: 36, background: "var(--blue)",
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <School size={20} color="#fff" />
          </div>

          {/* School name — this IS the primary brand */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: "#fff", fontFamily: "'Sora', sans-serif",
              fontWeight: 700, fontSize: 15, lineHeight: 1.25,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 148,
            }}>
              {schoolLine1}
            </div>
            {schoolLine2 && (
              <div style={{
                color: "#fff", fontFamily: "'Sora', sans-serif",
                fontWeight: 700, fontSize: 13, lineHeight: 1.25,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: 148,
              }}>
                {schoolLine2}
              </div>
            )}
          </div>
        </div>

        {/* Location / domain — tiny, subtle */}
        {school?.address && (
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.35)",
            marginTop: 4, letterSpacing: "0.04em",
            paddingLeft: 46,
          }}>
            {school.address}
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <div className="sidebar-nav">
        {nav.map(section => (
          <div key={section.label}>
            <div className="sidebar-section">{section.label}</div>
            {section.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <item.icon size={15} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* ── Footer: user chip + logout ── */}
      <div className="sidebar-footer">
        <div className="user-chip" onClick={handleLogout} title="Click to sign out">
          <div className="avatar">{initials}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{currentUser?.name}</div>
            <div className="user-chip-role" style={{ textTransform: "capitalize" }}>
              {currentUser?.role}
            </div>
          </div>
          <LogOut size={13} color="rgba(255,255,255,0.35)" />
        </div>
      </div>
    </div>
  );
}

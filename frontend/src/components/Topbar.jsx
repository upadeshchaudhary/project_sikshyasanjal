import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Search, Bell, Settings, X, Check, CheckCheck,
  BookOpen, MessageSquare, FileText, DollarSign,
  BarChart2, Calendar, Users, AlertCircle, GraduationCap,
  Moon, Sun,
} from "lucide-react";
import {
  mockStudents, mockTeachers, mockHomework, mockNotices,
} from "../data/mockData";

// ─── Build global search index ─────────────────────────────────────────────────
const SEARCH_INDEX = [
  ...mockStudents.map(s => ({
    id:    `student-${s.id}`,
    label: s.name,
    sub:   `Student · Class ${s.class} · Roll ${s.rollNo}`,
    icon:  Users,
    link:  "/students",
    color: "#1E3FF2",
    bg:    "var(--blue-pale)",
  })),
  ...mockTeachers.map(t => ({
    id:    `teacher-${t.id}`,
    label: t.name,
    sub:   `Teacher · ${t.subject}`,
    icon:  GraduationCap,
    link:  "/teachers",
    color: "#16A34A",
    bg:    "var(--green-pale)",
  })),
  ...mockHomework.map(h => ({
    id:    `hw-${h.id}`,
    label: h.title,
    sub:   `Homework · ${h.subject} · Class ${h.class}`,
    icon:  BookOpen,
    link:  "/homework",
    color: "#D97706",
    bg:    "var(--amber-pale)",
  })),
  ...mockNotices.map(n => ({
    id:    `notice-${n.id}`,
    label: n.title,
    sub:   `Notice · ${n.category}`,
    icon:  FileText,
    link:  "/notices",
    color: "#7C3AED",
    bg:    "var(--purple-pale)",
  })),
];

// ─── Search Dropdown ───────────────────────────────────────────────────────────
function SearchDropdown({ query, onSelect, onClose }) {
  const results = query.trim().length < 1 ? [] : SEARCH_INDEX.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.sub.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  if (results.length === 0) {
    if (query.trim().length < 2) return null;
    return (
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 9999,
        padding: "16px", textAlign: "center",
        color: "var(--text-2)", fontSize: 13,
      }}>
        No results for "<strong>{query}</strong>"
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 9999,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 12px 6px", fontSize: 10, fontWeight: 700,
        color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        {results.length} result{results.length !== 1 ? "s" : ""}
      </div>
      {results.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.link)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", cursor: "pointer",
              borderTop: i === 0 ? "1px solid var(--border)" : "none",
              borderBottom: "1px solid var(--border)",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--canvas)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: item.bg, color: item.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={14} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: "var(--text)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{item.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Notification type → icon + color ─────────────────────────────────────────
const NOTIF_META = {
  homework: { icon: BookOpen,      bg: "#EEF1FE", color: "#1E3FF2" },
  message:  { icon: MessageSquare, bg: "#DCFCE7", color: "#16A34A" },
  notice:   { icon: FileText,      bg: "#FEF3C7", color: "#D97706" },
  fee:      { icon: DollarSign,    bg: "#FEE2E2", color: "#DC2626" },
  result:   { icon: BarChart2,     bg: "#EDE9FE", color: "#7C3AED" },
  calendar: { icon: Calendar,      bg: "#FEF3C7", color: "#D97706" },
  student:  { icon: Users,         bg: "#DCFCE7", color: "#16A34A" },
  default:  { icon: AlertCircle,   bg: "#F1F3F9", color: "#5A6080" },
};

// ─── Single notification row ───────────────────────────────────────────────────
function NotifRow({ notif, onRead, onClear, onNavigate }) {
  const meta  = NOTIF_META[notif.type] || NOTIF_META.default;
  const Icon  = meta.icon;

  return (
    <div
      onClick={() => { onRead(notif.id); onNavigate(notif.link); }}
      style={{
        display: "flex", gap: 11, padding: "11px 16px",
        background: notif.read ? "transparent" : "#F6F8FF",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer", transition: "background 0.12s",
        alignItems: "flex-start",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#F0F4FF"}
      onMouseLeave={e => e.currentTarget.style.background = notif.read ? "transparent" : "#F6F8FF"}
    >
      {/* Icon bubble */}
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: meta.bg, color: meta.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={15} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: notif.read ? 500 : 700,
          color: "var(--text)", lineHeight: 1.3,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {notif.title}
        </div>
        <div style={{
          fontSize: 11, color: "var(--text-2)", marginTop: 2,
          lineHeight: 1.4, display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {notif.body}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
          {notif.time}
        </div>
      </div>

      {/* Unread dot + dismiss */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {!notif.read && (
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blue)" }} />
        )}
        <button
          onClick={e => { e.stopPropagation(); onClear(notif.id); }}
          style={{
            border: "none", background: "transparent", cursor: "pointer",
            color: "var(--text-3)", padding: 2, borderRadius: 4,
            display: "flex", alignItems: "center",
          }}
          title="Dismiss"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Notification Dropdown ─────────────────────────────────────────────────────
function NotifDropdown({ onClose }) {
  const { notifications, markNotifRead, markAllRead, clearNotif, unreadCount } = useApp();
  const navigate = useNavigate();

  const handleNavigate = (link) => {
    navigate(link);
    onClose();
  };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 10px)", right: 0,
      width: 360, background: "var(--card)",
      borderRadius: 14, boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
      border: "1px solid var(--border)", zIndex: 9999,
      overflow: "hidden",
      // Arrow pointer like extension dropdown
      "::before": {},
    }}>
      {/* Pointer triangle */}
      <div style={{
        position: "absolute", top: -7, right: 12,
        width: 14, height: 14,
        background: "var(--card)", border: "1px solid var(--border)",
        transform: "rotate(45deg)", borderRight: "none", borderBottom: "none",
        zIndex: 1,
      }} />

      {/* Header */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--card)", position: "relative", zIndex: 2,
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 8, background: "var(--blue)", color: "#fff",
              fontSize: 10, fontWeight: 700, borderRadius: 100,
              padding: "2px 7px",
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              title="Mark all read"
              style={{
                border: "none", background: "var(--canvas)", cursor: "pointer",
                color: "var(--text-2)", borderRadius: 7, padding: "5px 9px",
                fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <CheckCheck size={12} /> All read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              color: "var(--text-3)", borderRadius: 7, padding: 5,
              display: "flex", alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: "36px 20px", textAlign: "center",
            color: "var(--text-2)", fontSize: 13,
          }}>
            <Bell size={28} style={{ color: "var(--text-3)", marginBottom: 8, display: "block", margin: "0 auto 10px" }} />
            No notifications
          </div>
        ) : notifications.map(n => (
          <NotifRow
            key={n.id}
            notif={n}
            onRead={markNotifRead}
            onClear={clearNotif}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: "10px 16px", borderTop: "1px solid var(--border)",
          background: "var(--canvas)", textAlign: "center",
        }}>
          <button
            onClick={() => { handleNavigate("/messages"); }}
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              color: "var(--blue)", fontSize: 12, fontWeight: 600,
            }}
          >
            View all messages →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Topbar ───────────────────────────────────────────────────────────────
export default function Topbar({ title }) {
  const { currentUser, school, unreadCount, settings, updateSetting } = useApp();
  const navigate = useNavigate();
  const [search,       setSearch]       = useState("");
  const [showSearch,   setShowSearch]   = useState(false);
  const [showNotif,    setShowNotif]    = useState(false);
  const notifRef  = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) { setShowSearch(false); setSearch(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = (link) => {
    navigate(link);
    setSearch("");
    setShowSearch(false);
  };

  const isDark = settings.theme === "dark";

  return (
    <div className="topbar">
      {/* Page title */}
      <div style={{ marginRight: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{school?.name}</div>
      </div>

      {/* ── Working Search ── */}
      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: 360 }}>
        <div className="search-box" style={{ background: showSearch ? "var(--card)" : undefined }}>
          <Search size={14} />
          <input
            placeholder="Search students, teachers, homework…"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            style={{ width: "100%" }}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setShowSearch(false); }}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-3)", display: "flex" }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        {showSearch && (
          <SearchDropdown
            query={search}
            onSelect={handleSearchSelect}
            onClose={() => { setShowSearch(false); setSearch(""); }}
          />
        )}
      </div>

      {/* ── Dark mode toggle ── */}
      <div
        className="icon-btn"
        onClick={() => {
          const next = isDark ? "light" : "dark";
          updateSetting("theme", next);
        }}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </div>

      {/* ── Notification Bell ── */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <div
          className="icon-btn"
          onClick={() => setShowNotif(v => !v)}
          style={{ background: showNotif ? "var(--blue-pale)" : undefined, borderColor: showNotif ? "var(--blue)" : undefined, color: showNotif ? "var(--blue)" : undefined }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <div style={{
              position: "absolute", top: -5, right: -5,
              background: "var(--red)", color: "#fff",
              fontSize: 9, fontWeight: 800, borderRadius: 100,
              minWidth: 17, height: 17, padding: "0 4px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid var(--card)", lineHeight: 1,
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </div>
        {showNotif && <NotifDropdown onClose={() => setShowNotif(false)} />}
      </div>

      {/* ── Settings gear ── */}
      <div
        className="icon-btn"
        onClick={() => navigate("/settings")}
        title="Settings"
      >
        <Settings size={15} />
      </div>

      {/* User chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, borderLeft: "1px solid var(--border)" }}>
        <div className="avatar avatar-sm" style={{ background: "var(--blue)" }}>
          {currentUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{currentUser?.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "capitalize" }}>{currentUser?.role}</div>
        </div>
      </div>
    </div>
  );
}

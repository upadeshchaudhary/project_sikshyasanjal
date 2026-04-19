import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

import toast from "react-hot-toast";

// ── Demo credentials — must match your seeder ──────────────────────────────
const DEMO_ACCOUNTS = [
  {
    role: "admin",
    label: "Admin",
    email: "admin@sikshyasanjal.com",
    password: "Admin@123",
    color: "#1E3FF2",
    bg: "#EEF1FD",
  },
  {
    role: "teacher",
    label: "Teacher",
    email: "teacher@sikshyasanjal.com",
    password: "Teacher@123",
    color: "#0F6E56",
    bg: "#E1F5EE",
  },
  {
    role: "parent",
    label: "Parent",
    phone: "9800000001",
    password: "Parent@123",
    color: "#3C3489",
    bg: "#EEEDFE",
  },
];

const ROLES = [
  {
    key: "admin",
    label: "School Administrator",
    sub: "Manage your entire school",
    color: "#1E3FF2",
    bg: "#EEF1FD",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    key: "teacher",
    label: "Teacher",
    sub: "Manage classes & students",
    color: "#0F6E56",
    bg: "#E1F5EE",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h10M7 12h6"/>
      </svg>
    ),
  },
  {
    key: "parent",
    label: "Parent / Guardian",
    sub: "Track your child's progress",
    color: "#3C3489",
    bg: "#EEEDFE",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3"/>
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        <circle cx="19" cy="11" r="2"/>
        <path d="M21 21v-1a2 2 0 0 0-2-2h-1"/>
      </svg>
    ),
  },
];

// ── Root ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();

  const [step, setStep]             = useState("role"); // "role" | "form"
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [phone, setPhone]           = useState("");
  const [otp, setOtp]               = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [parentMode, setParentMode] = useState("password"); // "password" | "otp"
  const [otpSent, setOtpSent]       = useState(false);
  const [loading, setLoading]       = useState(false);

  const activeRole = ROLES.find((r) => r.key === selectedRole);

  // Fill demo credentials and jump to the right form
  function fillDemo(demo) {
    setSelectedRole(demo.role);
    setStep("form");
    if (demo.role === "parent") {
      setPhone(demo.phone);
      setPassword(demo.password);
      setParentMode("password");
    } else {
      setEmail(demo.email);
      setPassword(demo.password);
    }
    toast.success(`${demo.label} credentials filled — press Sign In!`);
  }

  // Simulate SMS OTP — in production: POST /auth/parent/send-otp
  async function handleSendOtp() {
    if (!phone.trim()) return toast.error("Enter your phone number");
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setOtpSent(true);
    setLoading(false);
    toast.success("OTP sent to +" + phone);
  }

  // Demo login — uses AppContext.login(user, school), no backend needed
  // In production: replace the await/mock with real axios calls, then call
  //   login(res.data.user, res.data.school) after verifying the JWT.
  async function handleSubmit() {
    if (!selectedRole) return toast.error("Select a role first");
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const DEMO_USERS_LOCAL = {
      admin:   { id:"u1", name:"Prakash Regmi",  role:"admin",   email:"admin@school.edu.np",   class:null },
      teacher: { id:"u2", name:"Sunita Koirala", role:"teacher", email:"teacher@school.edu.np", class:"10A" },
      parent:  { id:"u3", name:"Rajesh Sharma",  role:"parent",  phone:"9841000001",
                 childId:"s1", childName:"Aarav Sharma", childClass:"10A" },
    };
    const user = DEMO_USERS_LOCAL[selectedRole];
    const school = { name:"Shree Saraswati Secondary School", domain:"saraswati",
                     address:"Kathmandu, Nepal", phone:"+977-1-4567890", estYear:2041 };
    login(user, school);
    toast.success(`Welcome, ${user.name}!`);
    navigate("/dashboard");
    setLoading(false);
  }

  return (
    <div style={s.page}>
      <div style={s.bgBlob1} />
      <div style={s.bgBlob2} />

      {/* Brand */}
      <div style={s.brand}>
        <div style={s.brandIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3FF2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <span style={s.brandName}>SikshyaSanjal</span>
      </div>

      {/* Auth card */}
      <div style={s.card}>
        {step === "role" ? (
          <RoleSelector
            onSelect={(key) => { setSelectedRole(key); setStep("form"); }}
          />
        ) : (
          <LoginForm
            role={activeRole}
            parentMode={parentMode} setParentMode={setParentMode}
            otpSent={otpSent}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPass={showPass} setShowPass={setShowPass}
            phone={phone} setPhone={setPhone}
            otp={otp} setOtp={setOtp}
            loading={loading}
            onBack={() => { setStep("role"); setOtpSent(false); setOtp(""); }}
            onSendOtp={handleSendOtp}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Demo panel — always visible */}
      <DemoPanel
        accounts={DEMO_ACCOUNTS}
        activeRole={selectedRole}
        step={step}
        onFill={fillDemo}
      />

      <p style={s.footer}>
        &copy; {new Date().getFullYear()} SikshyaSanjal &middot; Built for Nepali Schools
      </p>
    </div>
  );
}

// ── Role Selector ──────────────────────────────────────────────────────────
function RoleSelector({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div>
      <h1 style={{ ...s.heading, marginBottom: 4 }}>Welcome back</h1>
      <p style={{ ...s.subheading, marginBottom: 26 }}>Select your role to continue</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => onSelect(role.key)}
            onMouseEnter={() => setHovered(role.key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...s.roleCard,
              border: hovered === role.key ? `1.5px solid ${role.color}` : "1.5px solid #E8EAED",
              background: hovered === role.key ? role.bg : "#FAFAFA",
              transform: hovered === role.key ? "translateX(4px)" : "translateX(0)",
            }}
          >
            <div style={{ ...s.roleIcon, color: role.color, background: role.bg }}>
              {role.icon}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ ...s.roleLabel, color: hovered === role.key ? role.color : "#1A1A2E" }}>
                {role.label}
              </div>
              <div style={s.roleSub}>{role.sub}</div>
            </div>
            <div style={{ marginLeft: "auto", color: hovered === role.key ? role.color : "#C0C4CC" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
        ))}
      </div>
      <p style={s.helpText}>Contact your school administrator if you don't have an account.</p>
    </div>
  );
}

// ── Login Form ─────────────────────────────────────────────────────────────
function LoginForm({
  role, parentMode, setParentMode, otpSent,
  email, setEmail, password, setPassword, showPass, setShowPass,
  phone, setPhone, otp, setOtp,
  loading, onBack, onSendOtp, onSubmit,
}) {
  const isParent = role.key === "parent";

  return (
    <div>
      {/* Back + role badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={s.backBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={{ ...s.roleIcon, color: role.color, background: role.bg, width: 36, height: 36, borderRadius: 10 }}>
          {role.icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1A2E" }}>{role.label}</div>
          <div style={{ fontSize: 11, color: "#8B8FA8" }}>{role.sub}</div>
        </div>
      </div>

      <h1 style={{ ...s.heading, fontSize: 23, marginBottom: 4 }}>Sign in</h1>
      <p style={{ ...s.subheading, marginBottom: 20 }}>
        {isParent ? "Track your child's academic journey" : "Access your school dashboard"}
      </p>

      {/* Parent mode toggle */}
      {isParent && (
        <div style={s.toggleRow}>
          <button
            onClick={() => setParentMode("password")}
            style={{ ...s.toggleBtn, ...(parentMode === "password" ? s.toggleActive(role.color) : {}) }}
          >
            Password
          </button>
          <button
            onClick={() => setParentMode("otp")}
            style={{ ...s.toggleBtn, ...(parentMode === "otp" ? s.toggleActive(role.color) : {}) }}
          >
            Phone OTP
          </button>
        </div>
      )}

      {/* Email — admin & teacher */}
      {!isParent && (
        <div style={s.fieldGroup}>
          <label style={s.label}>Email Address</label>
          <div style={s.inputWrap}>
            <span style={s.inputIconWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </span>
            <input
              style={s.input} type="email" placeholder="you@school.edu.np"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Phone — parent */}
      {isParent && (
        <div style={s.fieldGroup}>
          <label style={s.label}>Phone Number</label>
          <div style={s.inputWrap}>
            <span style={{ ...s.inputIconWrap, fontSize: 12, color: "#6B7280", fontFamily: "'JetBrains Mono', monospace", borderRight: "1px solid #E8EAED", paddingRight: 10, marginRight: 4 }}>
              +977
            </span>
            <input
              style={{ ...s.input, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}
              type="tel" placeholder="98XXXXXXXX" maxLength={10}
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>
      )}

      {/* Password */}
      {(!isParent || parentMode === "password") && (
        <div style={s.fieldGroup}>
          <label style={s.label}>Password</label>
          <div style={s.inputWrap}>
            <span style={s.inputIconWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              style={s.input}
              type={showPass ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
            <button onClick={() => setShowPass(!showPass)} style={s.eyeBtn}>
              {showPass
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>
      )}

      {/* OTP field */}
      {isParent && parentMode === "otp" && otpSent && (
        <div style={s.fieldGroup}>
          <label style={s.label}>OTP Code</label>
          <div style={s.inputWrap}>
            <span style={s.inputIconWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              style={{ ...s.input, letterSpacing: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 16 }}
              type="text" placeholder="• • • • • •" maxLength={6}
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            OTP expires in 5 minutes · Check your SMS
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 9 }}>
        {isParent && parentMode === "otp" && !otpSent ? (
          <PrimaryBtn color={role.color} loading={loading} onClick={onSendOtp}>
            Send OTP via SMS
          </PrimaryBtn>
        ) : (
          <PrimaryBtn color={role.color} loading={loading} onClick={onSubmit}>
            Sign In
          </PrimaryBtn>
        )}
        {isParent && parentMode === "otp" && otpSent && (
          <button style={s.ghostBtn} onClick={() => { setOtpSent(false); setOtp(""); }}>
            Resend OTP
          </button>
        )}
      </div>

      {/* Google OAuth — admin & teacher only */}
      {!isParent && (
        <>
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <div style={s.dividerLine} />
          </div>
          <button style={s.googleBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </>
      )}
    </div>
  );
}

// ── Demo Credentials Panel ─────────────────────────────────────────────────
function DemoPanel({ accounts, activeRole, step, onFill }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={s.demoWrap}>
      <button style={s.demoToggle} onClick={() => setOpen(!open)}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          Demo Accounts — click any to fill
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={s.demoGrid}>
          {accounts.map((demo) => {
            const isActive = activeRole === demo.role && step === "form";
            return (
              <button
                key={demo.role}
                onClick={() => onFill(demo)}
                style={{
                  ...s.demoCard,
                  border: isActive ? `1.5px solid ${demo.color}` : "1.5px solid #E8EAED",
                  background: isActive ? demo.bg : "#FAFAFA",
                }}
              >
                <div style={{ ...s.demoBadge, color: demo.color, background: isActive ? "#fff" : demo.bg }}>
                  {demo.label}
                </div>
                <div style={s.demoRow}>
                  <span style={s.demoKey}>{demo.role === "parent" ? "Phone" : "Email"}</span>
                  <span style={s.demoVal}>{demo.role === "parent" ? demo.phone : demo.email}</span>
                </div>
                <div style={s.demoRow}>
                  <span style={s.demoKey}>Pass</span>
                  <span style={{ ...s.demoVal, fontFamily: "'JetBrains Mono', monospace" }}>{demo.password}</span>
                </div>
                <div style={{ ...s.demoFill, color: demo.color }}>Use this ↗</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared mini-components ─────────────────────────────────────────────────
function PrimaryBtn({ color, loading, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        ...s.primaryBtn,
        background: loading ? "#9CA3AF" : color,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={s.spinner} />
          Processing…
        </span>
      ) : children}
    </button>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#F0F2FF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px 32px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Sora', sans-serif",
  },
  bgBlob1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(30,63,242,0.07) 0%, transparent 70%)",
    top: -160, right: -160, pointerEvents: "none",
  },
  bgBlob2: {
    position: "absolute", width: 360, height: 360, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(60,52,137,0.06) 0%, transparent 70%)",
    bottom: -100, left: -100, pointerEvents: "none",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 },
  brandIcon: {
    width: 38, height: 38, borderRadius: 11,
    background: "#EEF1FD", border: "1px solid rgba(30,63,242,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandName: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 21, color: "#1A1A2E", letterSpacing: "-0.3px",
  },
  card: {
    background: "#FFFFFF", borderRadius: 20,
    padding: "30px 28px", width: "100%", maxWidth: 430,
    boxShadow: "0 4px 32px rgba(30,63,242,0.08), 0 1px 0 rgba(0,0,0,0.04)",
    border: "1px solid #E8EAED",
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26, color: "#1A1A2E", margin: "0 0 8px", letterSpacing: "-0.3px",
  },
  subheading: { fontSize: 13, color: "#8B8FA8", margin: 0 },
  roleCard: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 14px", borderRadius: 13,
    cursor: "pointer", transition: "all 0.18s ease",
    background: "none", width: "100%",
  },
  roleIcon: {
    width: 44, height: 44, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  roleLabel: { fontWeight: 600, fontSize: 14, marginBottom: 2, transition: "color 0.18s" },
  roleSub: { fontSize: 12, color: "#8B8FA8" },
  helpText: { marginTop: 18, fontSize: 12, color: "#B0B4C8", textAlign: "center" },
  backBtn: {
    width: 32, height: 32, borderRadius: 9,
    border: "1.5px solid #E8EAED", background: "none",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#6B7280", flexShrink: 0,
  },
  toggleRow: {
    display: "flex", background: "#F0F2FF", borderRadius: 10,
    padding: 3, marginBottom: 16, gap: 3,
  },
  toggleBtn: {
    flex: 1, padding: "8px 0", border: "none", borderRadius: 8,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: "transparent", color: "#8B8FA8", transition: "all 0.18s",
    fontFamily: "'Sora', sans-serif",
  },
  toggleActive: (color) => ({ background: "#FFFFFF", color, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }),
  fieldGroup: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 },
  inputWrap: {
    display: "flex", alignItems: "center",
    border: "1.5px solid #E8EAED", borderRadius: 10,
    background: "#FAFAFA", overflow: "hidden",
  },
  inputIconWrap: { display: "flex", alignItems: "center", padding: "0 10px 0 12px", flexShrink: 0 },
  input: {
    flex: 1, border: "none", background: "transparent",
    padding: "11px 12px 11px 0", fontSize: 14,
    color: "#1A1A2E", outline: "none",
    fontFamily: "'Sora', sans-serif", minWidth: 0,
  },
  eyeBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "0 12px", display: "flex", alignItems: "center",
  },
  primaryBtn: {
    width: "100%", padding: "12px", borderRadius: 11,
    border: "none", color: "#FFFFFF", fontSize: 14,
    fontWeight: 700, fontFamily: "'Sora', sans-serif",
    letterSpacing: "0.2px", transition: "opacity 0.15s",
  },
  ghostBtn: {
    width: "100%", padding: "10px", borderRadius: 11,
    border: "1.5px solid #E8EAED", background: "transparent",
    color: "#6B7280", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Sora', sans-serif",
  },
  divider: { display: "flex", alignItems: "center", gap: 10, margin: "16px 0 12px" },
  dividerLine: { flex: 1, height: 1, background: "#E8EAED" },
  dividerText: { fontSize: 12, color: "#B0B4C8" },
  googleBtn: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10, padding: "11px",
    borderRadius: 11, border: "1.5px solid #E8EAED",
    background: "#FAFAFA", fontSize: 13, fontWeight: 600,
    color: "#374151", cursor: "pointer", fontFamily: "'Sora', sans-serif",
  },
  spinner: {
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  // Demo panel
  demoWrap: { width: "100%", maxWidth: 430, marginTop: 12 },
  demoToggle: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)",
    border: "1px solid #E8EAED", borderRadius: 10,
    padding: "8px 14px", fontSize: 12, fontWeight: 600,
    color: "#6B7280", cursor: "pointer", fontFamily: "'Sora', sans-serif",
  },
  demoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 },
  demoCard: {
    borderRadius: 10, padding: "10px 11px",
    cursor: "pointer", textAlign: "left",
    transition: "all 0.15s", fontFamily: "'Sora', sans-serif",
    background: "none",
  },
  demoBadge: {
    display: "inline-block", fontSize: 10, fontWeight: 700,
    padding: "2px 8px", borderRadius: 6, marginBottom: 7, letterSpacing: "0.3px",
  },
  demoRow: { display: "flex", flexDirection: "column", marginBottom: 4 },
  demoKey: { fontSize: 9, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" },
  demoVal: { fontSize: 10, color: "#374151", fontWeight: 600, wordBreak: "break-all", lineHeight: 1.4 },
  demoFill: { marginTop: 6, fontSize: 10, fontWeight: 700 },
  footer: { marginTop: 14, fontSize: 11, color: "#B0B4C8", textAlign: "center" },
};

// Inject spinner keyframe once
if (typeof document !== "undefined" && !document.getElementById("ss-spin")) {
  const st = document.createElement("style");
  st.id = "ss-spin";
  st.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(st);
}

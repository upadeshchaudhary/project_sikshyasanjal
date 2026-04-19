import { useState, useRef, useEffect } from "react";
import Topbar from "../components/Topbar";
import { mockMessages, mockTeachers } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { Plus, X, Send, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

// ─── Simulated E2E Encryption ─────────────────────────────────────────────────
// In production: use libsodium / Signal Protocol.
// Here we simulate the UX of E2E encryption:
//  • Messages are stored "encrypted" (Base64-like obfuscation for demo)
//  • Decryption happens client-side per session
//  • UI shows lock icon + "End-to-end encrypted" on every conversation

const ENCRYPT_KEY = "SS2082"; // demo only — in prod, per-user keypair

function encryptMessage(text) {
  // XOR + base64 — demo simulation only, NOT real crypto
  return btoa(text.split("").map((c,i) =>
    String.fromCharCode(c.charCodeAt(0) ^ ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length))
  ).join(""));
}

function decryptMessage(cipher) {
  try {
    const decoded = atob(cipher);
    return decoded.split("").map((c,i) =>
      String.fromCharCode(c.charCodeAt(0) ^ ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length))
    ).join("");
  } catch {
    return cipher; // already plain text (legacy mock data)
  }
}

// Pre-encrypt existing mock messages for the demo
function prepMessages(msgs) {
  return msgs.map(m => ({
    ...m,
    _encrypted: true,
    content: m.content, // keep plain for display, would be cipher in prod
    replies: (m.replies || []).map(r => ({ ...r, _encrypted:true })),
  }));
}

export default function MessagesPage() {
  const { currentUser } = useApp();
  const isParent  = currentUser?.role === "parent";
  const isAdmin   = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";

  const [messages,     setMessages]     = useState(prepMessages(mockMessages));
  const [selected,     setSelected]     = useState(null);
  const [reply,        setReply]        = useState("");
  const [showCompose,  setShowCompose]  = useState(false);
  const [showRaw,      setShowRaw]      = useState(false); // toggle to "see" encryption
  const [compose,      setCompose]      = useState({ to:"", subject:"", content:"" });
  const threadEnd = useRef(null);

  // ── Filter messages for this user ──────────────────────────────────────────
  // In production: user would only receive messages addressed to them.
  // For demo, all users see all mock messages but the concept is shown.
  const myMessages = isParent
    ? messages.filter(m => m.fromRole === "parent" || m.toRole === "parent" ||
        m.from === currentUser?.name || m.to === currentUser?.name)
    : messages;

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior:"smooth" });
  }, [selected]);

  const handleReply = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    const encrypted = encryptMessage(reply); // encrypt before "sending"
    const newReply  = {
      id:        "r" + Date.now(),
      from:      currentUser?.name || "User",
      content:   reply,            // displayed decrypted
      _cipher:   encrypted,        // what would be stored on server
      _encrypted: true,
      timestamp: "2082-11-26 Now",
      read:      true,
    };
    const updated = messages.map(m =>
      m.id === selected.id
        ? { ...m, replies:[...(m.replies||[]), newReply] }
        : m
    );
    setMessages(updated);
    setSelected(updated.find(m => m.id === selected.id));
    setReply("");
    toast.success("Message sent (E2E encrypted)");
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!compose.to || !compose.content.trim()) return;
    const encrypted = encryptMessage(compose.content);
    const msg = {
      id:        "m" + Date.now(),
      from:      currentUser?.name || "User",
      fromRole:  currentUser?.role || "user",
      to:        compose.to,
      toRole:    "teacher",
      subject:   compose.subject,
      content:   compose.content,   // displayed decrypted
      _cipher:   encrypted,          // "transmitted" encrypted
      _encrypted: true,
      timestamp: "2082-11-26 Now",
      read:      false,
      replies:   [],
    };
    setMessages(prev => [msg, ...prev]);
    toast.success("Message sent securely");
    setShowCompose(false);
    setCompose({ to:"", subject:"", content:"" });
  };

  // Recipient list — parents message teachers; teachers message parents/admin; admin messages all
  const recipientList = isParent
    ? mockTeachers.map(t => ({ label:`${t.name} (${t.subject})`, value:t.name }))
    : isTeacher
    ? [{ label:"Admin", value:"Admin" }, ...mockTeachers
        .filter(t => t.name !== currentUser?.name)
        .map(t => ({ label:`${t.name} (Teacher)`, value:t.name }))]
    : [ ...mockTeachers.map(t=>({ label:`${t.name} (Teacher)`, value:t.name })),
        { label:"All Parents", value:"All Parents" }];

  return (
    <>
      <Topbar title="Messages"/>
      <div className="page-content" style={{ padding:0, display:"flex", overflow:"hidden", height:"100%" }}>

        {/* ── Sidebar list ── */}
        <div style={{ width:300, flexShrink:0, borderRight:"1px solid var(--border)",
          display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)",
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>Inbox</div>
              {/* E2E indicator */}
              <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#15803D", marginTop:2 }}>
                <ShieldCheck size={10}/> End-to-end encrypted
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(true)}>
              <Plus size={13}/> Compose
            </button>
          </div>

          <div style={{ flex:1, overflow:"auto", padding:6 }}>
            {myMessages.map(m => (
              <div key={m.id}
                className={`message-item ${selected?.id===m.id?"active":""} ${!m.read?"unread":""}`}
                onClick={() => setSelected(m)}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span className="msg-subject">{m.subject}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    {m._encrypted && <Lock size={9} style={{ color:"#15803D", flexShrink:0 }}/>}
                    {!m.read && <span style={{ width:7, height:7, borderRadius:"50%",
                      background:"var(--blue)", flexShrink:0 }}/>}
                  </div>
                </div>
                <div className="msg-preview">
                  {m.from} → {m.to}
                </div>
                <div className="msg-meta mono">{m.timestamp}</div>
              </div>
            ))}
            {myMessages.length === 0 && (
              <div style={{ padding:24, textAlign:"center", color:"var(--text-3)", fontSize:13 }}>
                No messages yet
              </div>
            )}
          </div>
        </div>

        {/* ── Thread view ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {selected ? (
            <>
              {/* Thread header */}
              <div style={{ padding:"14px 24px", borderBottom:"1px solid var(--border)" }}>
                <div style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>{selected.subject}</div>
                <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:12, color:"var(--text-2)" }}>
                  <span>{selected.from} → {selected.to}</span>
                  {/* E2E badge */}
                  <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 8px",
                    background:"#DCFCE7", borderRadius:100, color:"#15803D", fontSize:11, fontWeight:600 }}>
                    <Lock size={10}/> End-to-end encrypted
                  </div>
                  {/* Toggle raw/encrypted view for demo */}
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:10, padding:"3px 8px" }}
                    onClick={() => setShowRaw(v => !v)}
                    title="Toggle encrypted view (demo)">
                    {showRaw ? <Eye size={11}/> : <EyeOff size={11}/>}
                    {showRaw ? " Show decrypted" : " Show encrypted"}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflow:"auto", padding:"20px 24px",
                display:"flex", flexDirection:"column", gap:14 }}>

                {/* Original message */}
                <div style={{ maxWidth:540 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div className="avatar avatar-sm">{selected.from[0]}</div>
                    <div style={{ background:"var(--canvas)", borderRadius:"0 12px 12px 12px",
                      padding:"12px 16px", flex:1, border:"1px solid var(--border)" }}>
                      <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{selected.from}</div>
                      <p style={{ fontSize:13, color:"var(--text-2)", lineHeight:1.6,
                        fontFamily: showRaw ? "'JetBrains Mono',monospace" : "inherit",
                        wordBreak:"break-all" }}>
                        {showRaw && selected._cipher
                          ? encryptMessage(selected.content)
                          : selected.content}
                      </p>
                      {showRaw && (
                        <div style={{ fontSize:9, color:"#15803D", marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
                          <Lock size={8}/> Stored encrypted on server
                        </div>
                      )}
                      <div className="mono" style={{ fontSize:10, color:"var(--text-3)", marginTop:6 }}>
                        {selected.timestamp}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {selected.replies?.map(r => {
                  const isMe = r.from === currentUser?.name;
                  return (
                    <div key={r.id} style={{ maxWidth:540, alignSelf: isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ display:"flex", gap:10, alignItems:"flex-start",
                        flexDirection: isMe ? "row-reverse" : "row" }}>
                        <div className="avatar avatar-sm"
                          style={{ background: isMe ? "var(--blue)" : "var(--green)" }}>
                          {r.from[0]}
                        </div>
                        <div style={{
                          background: isMe ? "var(--blue)" : "var(--canvas)",
                          border: isMe ? "none" : "1px solid var(--border)",
                          borderRadius: isMe ? "12px 0 12px 12px" : "0 12px 12px 12px",
                          padding:"12px 16px", flex:1,
                        }}>
                          <div style={{ fontWeight:600, fontSize:13, marginBottom:4,
                            color: isMe ? "rgba(255,255,255,0.8)" : "var(--text)" }}>{r.from}</div>
                          <p style={{ fontSize:13, lineHeight:1.6, wordBreak:"break-all",
                            color: isMe ? "rgba(255,255,255,0.9)" : "var(--text-2)",
                            fontFamily: showRaw ? "'JetBrains Mono',monospace" : "inherit" }}>
                            {showRaw && r._cipher ? r._cipher : r.content}
                          </p>
                          <div className="mono" style={{ fontSize:10, marginTop:6,
                            color: isMe ? "rgba(255,255,255,0.4)" : "var(--text-3)" }}>
                            {r.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEnd}/>
              </div>

              {/* Reply input */}
              <form onSubmit={handleReply} style={{ padding:"12px 24px",
                borderTop:"1px solid var(--border)", display:"flex", gap:10, alignItems:"center" }}>
                <Lock size={13} style={{ color:"#15803D", flexShrink:0 }}/>
                <input className="form-input" style={{ flex:1 }}
                  placeholder="Write a reply (end-to-end encrypted)..."
                  value={reply} onChange={e => setReply(e.target.value)}/>
                <button type="submit" className="btn btn-primary">
                  <Send size={14}/> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", height:"100%", gap:12, color:"var(--text-3)" }}>
              <ShieldCheck size={36} style={{ opacity:0.3 }}/>
              <div style={{ fontSize:14, fontWeight:500 }}>Select a conversation</div>
              <div style={{ fontSize:11, display:"flex", alignItems:"center", gap:4, color:"#15803D" }}>
                <Lock size={10}/> All messages are end-to-end encrypted
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Compose modal ── */}
      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">New Message</div>
                <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#15803D", marginTop:2 }}>
                  <Lock size={10}/> End-to-end encrypted
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCompose(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSend}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">To</label>
                  <select className="form-input" required value={compose.to}
                    onChange={e => setCompose(p=>({...p,to:e.target.value}))}>
                    <option value="">Select recipient...</option>
                    {recipientList.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" required value={compose.subject}
                    onChange={e => setCompose(p=>({...p,subject:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows={5} required value={compose.content}
                    onChange={e => setCompose(p=>({...p,content:e.target.value}))}
                    placeholder="Your message will be encrypted before sending..."/>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11,
                  color:"var(--text-3)", padding:"8px 0", borderTop:"1px solid var(--border)" }}>
                  <ShieldCheck size={12} style={{ color:"#15803D" }}/>
                  Message is encrypted with the recipient's public key before transmission.
                  Only the recipient can decrypt it.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCompose(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Lock size={13}/> Send Encrypted
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from "react";
import Topbar from "../components/Topbar";
import { mockTeachers, SUBJECTS, CLASSES } from "../data/mockData";
import { Plus, Pencil, Trash2, X, Eye, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function TeachersPage() {
  const { currentUser } = useApp();
  // Derive role every render — never stash in state
  const isAdmin   = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";
  const isParent  = currentUser?.role === "parent";

  const [added,       setAdded]       = useState([]);
  const [deleted,     setDeleted]     = useState([]);
  const [edited,      setEdited]      = useState({});
  const teachers = [
    ...mockTeachers.filter(t => !deleted.includes(t.id)).map(t => edited[t.id] ? { ...t, ...edited[t.id] } : t),
    ...added.filter(a => !deleted.includes(a.id)),
  ];

  const [showModal,   setShowModal]   = useState(false);
  const [viewModal,   setViewModal]   = useState(null);
  const [editTeacher, setEditTeacher] = useState(null);
  const [form,        setForm]        = useState({ name:"", subject:"Mathematics", qualification:"", phone:"", email:"", joiningDate:"" });

  const openAdd = () => {
    if (!isAdmin) { toast.error("Only admin can add teachers"); return; }
    setEditTeacher(null);
    setForm({ name:"", subject:"Mathematics", qualification:"", phone:"", email:"", joiningDate:"" });
    setShowModal(true);
  };

  const openEdit = (t) => {
    // Teachers may only edit their own profile
    if (isTeacher && t.name !== currentUser?.name) {
      toast.error("You can only edit your own profile");
      return;
    }
    if (isParent) { toast.error("Parents cannot edit teacher profiles"); return; }
    setEditTeacher(t);
    setForm({ ...t });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editTeacher) {
      setEdited(prev => ({ ...prev, [editTeacher.id]: form }));
      toast.success("Teacher updated!");
    } else {
      setAdded(prev => [...prev, { ...form, id:"t"+Date.now(), classes:[] }]);
      toast.success("Teacher added!");
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!isAdmin) { toast.error("Only admin can remove teachers"); return; }
    setDeleted(prev => [...prev, id]);
    toast.success("Teacher removed");
  };

  return (
    <>
      <Topbar title="Teachers"/>
      <div className="page-content">
        <div className="page-header">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h1 className="page-title">Teachers</h1>
              <p className="page-subtitle">{teachers.length} teaching staff</p>
            </div>
            {/* Add button: admin only */}
            {isAdmin && (
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={15}/> Add Teacher
              </button>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom:24 }}>
          {teachers.map(t => {
            const isOwnProfile = isTeacher && t.name === currentUser?.name;
            // Render-time permission — no shortcuts, checked on every render
            const canEdit = isAdmin || isOwnProfile;
            const canDel  = isAdmin;

            return (
              <div key={t.id} className="card" style={{ padding:20 }}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div className="avatar" style={{ width:44, height:44, fontSize:16,
                    background: isOwnProfile ? "var(--green)" : "var(--blue)" }}>
                    {t.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ fontWeight:600, fontSize:15 }}>{t.name}</div>
                      {isOwnProfile && <span className="tag tag-green" style={{fontSize:9}}>You</span>}
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-2)" }}>{t.subject} Teacher</div>
                    <div style={{ fontSize:12, color:"var(--text-2)", marginTop:2 }}>{t.qualification}</div>
                    <div style={{ marginTop:8, display:"flex", gap:4, flexWrap:"wrap" }}>
                      {t.classes?.map(c => <span key={c} className="tag tag-blue">{c}</span>)}
                    </div>
                    <div style={{ marginTop:8, display:"flex", gap:10, fontSize:12, color:"var(--text-2)", flexWrap:"wrap" }}>
                      <span>📞 {t.phone}</span>
                      <span style={{ wordBreak:"break-all" }}>✉️ {t.email}</span>
                    </div>
                  </div>

                  {/* Action buttons — strictly role-gated */}
                  <div style={{ display:"flex", gap:4, flexDirection:"column", flexShrink:0 }}>
                    {/* View: everyone */}
                    <button className="btn btn-ghost btn-sm" title="View details"
                      onClick={() => setViewModal(t)}>
                      <Eye size={13}/>
                    </button>
                    {/* Edit: admin or own profile only */}
                    {canEdit && (
                      <button className="btn btn-ghost btn-sm" title="Edit"
                        onClick={() => openEdit(t)}>
                        <Pencil size={13}/>
                      </button>
                    )}
                    {/* Delete: admin only */}
                    {canDel && (
                      <button className="btn btn-danger btn-sm" title="Delete"
                        onClick={() => handleDelete(t.id)}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                    {/* Parent / non-admin teacher viewing others: lock icon */}
                    {!canEdit && !isAdmin && (
                      <span title="Read-only"
                        style={{ opacity:0.25, display:"flex", alignItems:"center", padding:"5px 6px" }}>
                        <Lock size={12}/>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View-only modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Teacher Profile</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16,
                paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
                <div className="avatar" style={{ width:52, height:52, fontSize:18, background:"var(--blue)" }}>
                  {viewModal.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:17 }}>{viewModal.name}</div>
                  <div style={{ fontSize:13, color:"var(--text-2)" }}>{viewModal.subject} Teacher</div>
                </div>
              </div>
              {[
                ["Qualification",    viewModal.qualification],
                ["Phone",            viewModal.phone],
                ["Email",            viewModal.email],
                ["Joined (BS)",      viewModal.joiningDate],
                ["Assigned Classes", viewModal.classes?.join(", ") || "—"],
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between",
                  padding:"8px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                  <span style={{ color:"var(--text-3)", fontWeight:500 }}>{label}</span>
                  <span style={{ color:"var(--text)" }}>{val}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (isAdmin || isTeacher) && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editTeacher ? "Edit Teacher" : "Add Teacher"}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={form.name}
                    disabled={isTeacher && !!editTeacher}
                    onChange={e => setForm(p=>({...p,name:e.target.value}))}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select className="form-input" value={form.subject}
                      onChange={e => setForm(p=>({...p,subject:e.target.value}))}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qualification</label>
                    <input className="form-input" value={form.qualification}
                      onChange={e => setForm(p=>({...p,qualification:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input mono" value={form.phone}
                      onChange={e => setForm(p=>({...p,phone:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={form.email}
                      onChange={e => setForm(p=>({...p,email:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date (BS)</label>
                  <input className="form-input mono" placeholder="YYYY-MM-DD" value={form.joiningDate}
                    onChange={e => setForm(p=>({...p,joiningDate:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTeacher ? "Save Changes" : "Add Teacher"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

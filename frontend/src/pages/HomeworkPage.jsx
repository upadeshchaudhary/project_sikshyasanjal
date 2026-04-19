import { useState } from "react";
import Topbar from "../components/Topbar";
import { mockHomework, CLASSES, SUBJECTS } from "../data/mockData";
import { Plus, X, BookOpen, Pencil, Trash2, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

const priorityColors = { high:"tag-red", medium:"tag-amber", low:"tag-green" };

export default function HomeworkPage() {
  const { currentUser } = useApp();
  const isParent  = currentUser?.role === "parent";
  const isAdmin   = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";

  // Parents: only see their child's class homework — no filter UI shown
  const childClass = currentUser?.childClass; // e.g. "10A"

  const [added,       setAdded]       = useState([]);
  const [deleted,     setDeleted]     = useState([]);
  const [edited,      setEdited]      = useState({});

  // All homework derived every render
  const allHw = [
    ...mockHomework.filter(h => !deleted.includes(h.id))
      .map(h => edited[h.id] ? { ...h, ...edited[h.id] } : h),
    ...added.filter(a => !deleted.includes(a.id)),
  ];

  // Parents see only their child's class — no choice
  const baseHw = isParent
    ? allHw.filter(h => h.class === childClass)
    : allHw;

  const [classFilter, setClassFilter] = useState("all");
  const [showModal,   setShowModal]   = useState(false);
  const [editHw,      setEditHw]      = useState(null);
  const [form,        setForm]        = useState({ title:"", subject:"Mathematics", class:"10A", description:"", dueDate:"", priority:"medium" });

  // Apply class filter for admin/teacher only
  const filtered = isParent
    ? baseHw
    : classFilter === "all" ? baseHw : baseHw.filter(h => h.class === classFilter);

  const openAdd = () => {
    setEditHw(null);
    setForm({ title:"", subject:"Mathematics", class:"10A", description:"", dueDate:"", priority:"medium" });
    setShowModal(true);
  };

  const openEdit = (h) => {
    setEditHw(h);
    setForm({ ...h });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editHw) {
      setEdited(prev => ({ ...prev, [editHw.id]: form }));
      toast.success("Homework updated!");
    } else {
      setAdded(prev => [...prev, { ...form, id:"h"+Date.now(), postedBy:currentUser?.name||"Teacher", postedAt:"2082-11-26" }]);
      toast.success("Homework posted!");
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setDeleted(prev => [...prev, id]);
    toast.success("Deleted");
  };

  return (
    <>
      <Topbar title="Homework"/>
      <div className="page-content">
        <div className="page-header">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h1 className="page-title">Homework</h1>
              <p className="page-subtitle">
                {isParent
                  ? `Class ${childClass} assignments — ${filtered.length} posted`
                  : `${filtered.length} assignments`}
              </p>
            </div>
            {/* Post button: admin and teacher only */}
            {(isAdmin || isTeacher) && (
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={15}/> Post Homework
              </button>
            )}
          </div>
        </div>

        {/* Class filter: admin and teacher only — parents have no choice UI */}
        {(isAdmin || isTeacher) && (
          <div className="filter-bar">
            <select className="form-input" style={{ width:"auto" }} value={classFilter}
              onChange={e => setClassFilter(e.target.value)}>
              <option value="all">All Classes</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Parent class badge — shows which class they're viewing */}
        {isParent && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16,
            padding:"8px 14px", background:"var(--canvas)", border:"1px solid var(--border)",
            borderRadius:8, fontSize:12, color:"var(--text-2)" }}>
            <Lock size={12}/>
            Showing homework for <span className="tag tag-blue" style={{ marginLeft:4 }}>{childClass}</span>
            &nbsp;only — your child's class
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {filtered.map(h => (
            <div key={h.id} className="card" style={{ padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <span className="tag tag-blue">{h.class}</span>
                  <span className={`tag ${priorityColors[h.priority]}`}>{h.priority}</span>
                </div>
                {/* Edit/Delete: admin and teacher only */}
                {(isAdmin || isTeacher) && (
                  <div style={{ display:"flex", gap:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(h)}><Pencil size={12}/></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(h.id)}><Trash2 size={12}/></button>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                <BookOpen size={16} color="var(--blue)" style={{ marginTop:2, flexShrink:0 }}/>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{h.title}</div>
                  <div style={{ fontSize:12, color:"var(--text-2)", marginTop:2 }}>{h.subject}</div>
                </div>
              </div>
              <p style={{ fontSize:12, color:"var(--text-2)", marginBottom:10, lineHeight:1.5 }}>{h.description}</p>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text-3)",
                borderTop:"1px solid var(--border)", paddingTop:8 }}>
                <span>By {h.postedBy}</span>
                <span className="mono">Due: {h.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <BookOpen size={32} style={{ marginBottom:8, opacity:0.3 }}/>
            <p>No homework posted{isParent ? ` for Class ${childClass}` : ""}</p>
          </div>
        )}
      </div>

      {/* Post/Edit modal: admin and teacher only */}
      {showModal && (isAdmin || isTeacher) && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editHw ? "Edit Homework" : "Post Homework"}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" required value={form.title}
                    onChange={e => setForm(p=>({...p,title:e.target.value}))}/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <select className="form-input" value={form.class}
                      onChange={e => setForm(p=>({...p,class:e.target.value}))}>
                      {CLASSES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select className="form-input" value={form.subject}
                      onChange={e => setForm(p=>({...p,subject:e.target.value}))}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Due Date (BS)</label>
                    <input className="form-input mono" placeholder="2082-MM-DD" value={form.dueDate}
                      onChange={e => setForm(p=>({...p,dueDate:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={form.priority}
                      onChange={e => setForm(p=>({...p,priority:e.target.value}))}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.description}
                    onChange={e => setForm(p=>({...p,description:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editHw ? "Save Changes" : "Post"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

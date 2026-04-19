import { useState } from "react";
import Topbar from "../components/Topbar";
import { mockStudents, CLASSES } from "../data/mockData";
import { Plus, Search, Pencil, Trash2, X, Eye, Users, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function StudentsPage() {
  const { currentUser } = useApp();
  const isAdmin   = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";
  const isParent  = currentUser?.role === "parent";

  // ── Extra students added by admin during this session ──────────────────────
  const [added,       setAdded]       = useState([]);
  const [deleted,     setDeleted]     = useState([]); // ids removed by admin
  const [edited,      setEdited]      = useState({}); // id -> overridden fields

  // ── Derive base list EVERY render — never store role-filtered list in state ─
  const allStudents = [
    ...mockStudents.filter(s => !deleted.includes(s.id)).map(s => edited[s.id] ? { ...s, ...edited[s.id] } : s),
    ...added.filter(a => !deleted.includes(a.id)),
  ];

  // Parents can ONLY see their own child
  const students = isParent
    ? allStudents.filter(s => s.id === currentUser?.childId)
    : allStudents;

  const [search,       setSearch]       = useState("");
  const [classFilter,  setClassFilter]  = useState("all");
  const [showModal,    setShowModal]    = useState(false);
  const [viewModal,    setViewModal]    = useState(null);
  const [editStudent,  setEditStudent]  = useState(null);
  const [form,         setForm]         = useState({ name:"", rollNo:"", class:"10A", gender:"Male", parentName:"", parentPhone:"", address:"", dob:"" });

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search);
    const matchClass  = classFilter === "all" || s.class === classFilter;
    return matchSearch && matchClass;
  });

  const openAdd = () => {
    if (!isAdmin) { toast.error("Only admin can add students"); return; }
    setEditStudent(null);
    setForm({ name:"", rollNo:"", class:"10A", gender:"Male", parentName:"", parentPhone:"", address:"", dob:"" });
    setShowModal(true);
  };

  const openEdit = (s) => {
    if (!isAdmin) { toast.error("Only admin can edit student records"); return; }
    setEditStudent(s);
    setForm({ ...s });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editStudent) {
      setEdited(prev => ({ ...prev, [editStudent.id]: form }));
      toast.success("Student updated!");
    } else {
      setAdded(prev => [...prev, { ...form, id:"s"+Date.now() }]);
      toast.success("Student added!");
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!isAdmin) { toast.error("Only admin can delete students"); return; }
    setDeleted(prev => [...prev, id]);
    toast.success("Student removed");
  };

  return (
    <>
      <Topbar title="Students"/>
      <div className="page-content">
        <div className="page-header">
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <h1 className="page-title">{isParent ? "My Child" : "Students"}</h1>
              <p className="page-subtitle">
                {isParent ? "Your child's profile information" : `${students.length} students enrolled`}
              </p>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={15}/> Add Student
              </button>
            )}
          </div>
        </div>

        {!isParent && (
          <div className="filter-bar">
            <div className="search-box" style={{ flex:"none", width:260 }}>
              <Search size={14}/>
              <input placeholder="Search by name or roll no..." value={search}
                onChange={e => setSearch(e.target.value)}/>
            </div>
            <select className="form-input" style={{ width:"auto" }} value={classFilter}
              onChange={e => setClassFilter(e.target.value)}>
              <option value="all">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="tag tag-blue">{filtered.length} results</span>
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Gender</th>
                {!isParent && <th>Parent</th>}
                {!isParent && <th>Phone</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><span className="mono tag tag-gray">{s.rollNo}</span></td>
                  <td style={{ fontWeight:500 }}>{s.name}</td>
                  <td><span className="tag tag-blue">{s.class}</span></td>
                  <td><span className={`tag ${s.gender==="Male"?"tag-blue":"tag-purple"}`}>{s.gender}</span></td>
                  {!isParent && <td style={{ color:"var(--text-2)" }}>{s.parentName}</td>}
                  {!isParent && <td className="mono" style={{ fontSize:12, color:"var(--text-2)" }}>{s.parentPhone}</td>}
                  <td>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <button className="btn btn-ghost btn-sm" title="View" onClick={() => setViewModal(s)}>
                        <Eye size={13}/>
                      </button>
                      {/* Edit + Delete: admin ONLY */}
                      {isAdmin && <>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil size={13}/>
                        </button>
                        <button className="btn btn-danger btn-sm" title="Delete" onClick={() => handleDelete(s.id)}>
                          <Trash2 size={13}/>
                        </button>
                      </>}
                      {/* Non-admins see a locked indicator */}
                      {!isAdmin && (
                        <span title="Read-only — contact admin to make changes"
                          style={{ opacity:0.3, display:"flex", alignItems:"center", padding:"4px 6px" }}>
                          <Lock size={12}/>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Users size={32} style={{ marginBottom:8, opacity:0.3 }}/>
              <p>No students found</p>
            </div>
          )}
        </div>
      </div>

      {/* View modal — all roles */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Student Profile</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16,
                paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
                <div className="avatar" style={{ width:48, height:48, fontSize:17, background:"var(--blue)" }}>
                  {viewModal.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{viewModal.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-2)" }}>Class {viewModal.class} · Roll {viewModal.rollNo}</div>
                </div>
              </div>
              {[
                ["Gender",    viewModal.gender],
                ["Address",   viewModal.address],
                ["Date of Birth", viewModal.dob],
                ...(!isParent ? [["Parent", viewModal.parentName], ["Parent Phone", viewModal.parentPhone]] : []),
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between",
                  padding:"7px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
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

      {/* Add/Edit modal — admin only */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editStudent ? "Edit Student" : "Add Student"}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" required value={form.name}
                      onChange={e => setForm(p=>({...p,name:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input className="form-input mono" required value={form.rollNo}
                      onChange={e => setForm(p=>({...p,rollNo:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Class *</label>
                    <select className="form-input" value={form.class}
                      onChange={e => setForm(p=>({...p,class:e.target.value}))}>
                      {CLASSES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-input" value={form.gender}
                      onChange={e => setForm(p=>({...p,gender:e.target.value}))}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Parent Name</label>
                    <input className="form-input" value={form.parentName}
                      onChange={e => setForm(p=>({...p,parentName:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Phone</label>
                    <input className="form-input mono" placeholder="98XXXXXXXX" value={form.parentPhone}
                      onChange={e => setForm(p=>({...p,parentPhone:e.target.value}))}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address}
                    onChange={e => setForm(p=>({...p,address:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={form.dob}
                    onChange={e => setForm(p=>({...p,dob:e.target.value}))}/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editStudent ? "Save Changes" : "Add Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

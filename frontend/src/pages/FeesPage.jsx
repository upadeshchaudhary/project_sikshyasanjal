import { useState } from "react";
import Topbar from "../components/Topbar";
import { mockFees } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { CheckCircle, X, Pencil } from "lucide-react";
import toast from "react-hot-toast";

const statusTag = { paid:"tag-green", partial:"tag-amber", pending:"tag-blue", overdue:"tag-red" };

export default function FeesPage() {
  const { currentUser } = useApp();
  const isParent = currentUser?.role === "parent";
  const [fees, setFees] = useState(mockFees);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editFee, setEditFee] = useState(null);
  const [payForm, setPayForm] = useState({ paid:"", method:"cash", status:"paid" });

  const myFees = isParent ? fees.filter(f=>f.studentId===currentUser.childId) : fees;
  const filtered = filter==="all" ? myFees : myFees.filter(f=>f.status===filter);

  const totalCollected = fees.reduce((s,f)=>s+f.paid,0);
  const totalPending = fees.reduce((s,f)=>s+(f.amount-f.paid),0);
  const overdueCount = fees.filter(f=>f.status==="overdue").length;

  const openPay = (fee) => { setEditFee(fee); setPayForm({paid:String(fee.amount-fee.paid),method:"cash",status:"paid"}); setShowModal(true); };

  const handlePayment = (e) => {
    e.preventDefault();
    setFees(prev=>prev.map(f=>f.id===editFee.id?{...f,paid:f.paid+Number(payForm.paid),status:payForm.status,method:payForm.method,paidDate:"2082-01-18"}:f));
    toast.success("Payment recorded!");
    setShowModal(false);
  };

  return (
    <>
      <Topbar title="Fee Tracking"/>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">{isParent?"Fee Status":"Fee Tracking"}</h1>
          <p className="page-subtitle">{isParent?"View your child's fee records":"Manage and track school fees"}</p>
        </div>

        {!isParent && (
          <div className="fee-summary">
            <div className="fee-box">
              <div className="fee-box-label">Total Collected</div>
              <div className="fee-box-value" style={{color:"var(--green)"}}>NPR {totalCollected.toLocaleString()}</div>
            </div>
            <div className="fee-box">
              <div className="fee-box-label">Pending / Due</div>
              <div className="fee-box-value" style={{color:"var(--amber)"}}>NPR {totalPending.toLocaleString()}</div>
            </div>
            <div className="fee-box">
              <div className="fee-box-label">Overdue Records</div>
              <div className="fee-box-value" style={{color:"var(--red)"}}>{overdueCount}</div>
            </div>
          </div>
        )}

        <div className="filter-bar">
          {["all","paid","partial","pending","overdue"].map(s=>(
            <button key={s} className={`btn btn-sm ${filter===s?"btn-primary":"btn-outline"}`} onClick={()=>setFilter(s)} style={{textTransform:"capitalize"}}>{s}</button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th><th>Class</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Method</th><th>Due Date</th>
                {!isParent&&<th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f=>(
                <tr key={f.id}>
                  <td style={{fontWeight:500}}>{f.studentName}</td>
                  <td><span className="tag tag-blue">{f.class}</span></td>
                  <td className="mono">NPR {f.amount.toLocaleString()}</td>
                  <td className="mono" style={{color:"var(--green)"}}>NPR {f.paid.toLocaleString()}</td>
                  <td className="mono" style={{color:f.amount-f.paid>0?"var(--red)":"var(--green)"}}>NPR {(f.amount-f.paid).toLocaleString()}</td>
                  <td><span className={`tag ${statusTag[f.status]}`}>{f.status}</span></td>
                  <td style={{fontSize:12,color:"var(--text-2)",textTransform:"capitalize"}}>{f.method?.replace("_"," ")||"—"}</td>
                  <td className="mono" style={{fontSize:12}}>{f.dueDate}</td>
                  {!isParent&&(
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={()=>openPay(f)} disabled={f.status==="paid"}>
                        <CheckCircle size={13}/>Record
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div className="empty-state"><p>No fee records found</p></div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Record Payment</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowModal(false)}><X size={16}/></button>
            </div>
            {editFee && (
              <form onSubmit={handlePayment}>
                <div className="modal-body">
                  <p style={{fontSize:13,marginBottom:16}}>Recording payment for <strong>{editFee.studentName}</strong> — Balance: <span className="mono" style={{color:"var(--red)"}}>NPR {(editFee.amount-editFee.paid).toLocaleString()}</span></p>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Amount Received (NPR)</label><input type="number" className="form-input mono" required value={payForm.paid} onChange={e=>setPayForm(p=>({...p,paid:e.target.value}))}/></div>
                    <div className="form-group"><label className="form-label">Payment Method</label>
                      <select className="form-input" value={payForm.method} onChange={e=>setPayForm(p=>({...p,method:e.target.value}))}>
                        <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="esewa">eSewa</option><option value="khalti">Khalti</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label className="form-label">Mark As</label>
                    <select className="form-input" value={payForm.status} onChange={e=>setPayForm(p=>({...p,status:e.target.value}))}>
                      <option value="paid">Fully Paid</option><option value="partial">Partially Paid</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><CheckCircle size={14}/>Record Payment</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

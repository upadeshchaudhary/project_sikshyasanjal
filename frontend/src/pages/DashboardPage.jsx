import { useApp } from "../context/AppContext";
import Topbar from "../components/Topbar";
import { mockStudents, mockTeachers, mockNotices, mockHomework, mockFees, mockMessages, attendanceChartData, enrollmentData } from "../data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Users, GraduationCap, CheckSquare, TrendingUp, AlertCircle, BookOpen, MessageSquare } from "lucide-react";

function AdminDashboard() {
  const totalFees = mockFees.reduce((s,f)=>s+f.paid,0);
  const pendingFees = mockFees.filter(f=>f.status!=="paid").reduce((s,f)=>s+(f.amount-f.paid),0);

  return (
    <>
      <Topbar title="Admin Dashboard"/>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Good morning, Principal 👋</h1>
          <p className="page-subtitle">Here's what's happening at your school today.</p>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#EEF1FE"}}>
              <Users size={20} color="#1E3FF2"/>
            </div>
            <div>
              <div className="stat-label">Total Students</div>
              <div className="stat-value mono">487</div>
              <div className="stat-trend">▲ +12% this year</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#DCFCE7"}}>
              <GraduationCap size={20} color="#15803D"/>
            </div>
            <div>
              <div className="stat-label">Total Teachers</div>
              <div className="stat-value mono">{mockTeachers.length}</div>
              <div className="stat-trend">Active this term</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#FEF3C7"}}>
              <CheckSquare size={20} color="#D97706"/>
            </div>
            <div>
              <div className="stat-label">Today's Attendance</div>
              <div className="stat-value mono">93%</div>
              <div className="stat-trend">451 / 487 present</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#EDE9FE"}}>
              <TrendingUp size={20} color="#8B5CF6"/>
            </div>
            <div>
              <div className="stat-label">Fees Collected</div>
              <div className="stat-value mono">NPR {(totalFees/1000).toFixed(0)}k</div>
              <div className="stat-trend down">NPR {(pendingFees/1000).toFixed(0)}k pending</div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{marginBottom:24}}>
          <div className="card">
            <div className="card-header"><div className="card-title">Monthly Attendance Rate</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceChartData}>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:"var(--text-2)"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:"var(--text-2)"}} axisLine={false} tickLine={false} domain={[70,100]}/>
                  <Tooltip contentStyle={{borderRadius:8,border:"1px solid var(--border)",fontSize:12}}/>
                  <Bar dataKey="present" fill="#1E3FF2" radius={[4,4,0,0]} name="Present %"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Enrollment Trend</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={enrollmentData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3"/>
                  <XAxis dataKey="year" tick={{fontSize:11,fill:"var(--text-2)"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:"var(--text-2)"}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{borderRadius:8,border:"1px solid var(--border)",fontSize:12}}/>
                  <Line type="monotone" dataKey="students" stroke="#1E3FF2" strokeWidth={2} dot={{fill:"#1E3FF2",r:4}} name="Students"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Notices</div></div>
            <div className="card-body" style={{padding:"12px 24px"}}>
              {mockNotices.slice(0,4).map(n=>(
                <div key={n.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                  <AlertCircle size={16} color={n.important?"var(--red)":"var(--text-3)"} style={{marginTop:2,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:500}}>{n.title}</div>
                    <div style={{fontSize:11,color:"var(--text-2)",marginTop:2}}>{n.category} • {n.postedAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Homework</div></div>
            <div className="card-body" style={{padding:"12px 24px"}}>
              {mockHomework.slice(0,4).map(h=>(
                <div key={h.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                  <BookOpen size={16} color="var(--blue)" style={{marginTop:2,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:500}}>{h.title}</div>
                    <div style={{fontSize:11,color:"var(--text-2)",marginTop:2}}>{h.class} • {h.subject} • Due: {h.dueDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TeacherDashboard({ user }) {
  return (
    <>
      <Topbar title="Teacher Dashboard"/>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Welcome, {user.name.split(" ")[0]} 👋</h1>
          <p className="page-subtitle">Your classes and tasks for today.</p>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#EEF1FE"}}><Users size={20} color="#1E3FF2"/></div>
            <div><div className="stat-label">My Classes</div><div className="stat-value mono">3</div><div className="stat-trend">10A, 10B, 9A</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#DCFCE7"}}><BookOpen size={20} color="#15803D"/></div>
            <div><div className="stat-label">Homework Posted</div><div className="stat-value mono">3</div><div className="stat-trend">This week</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#FEF3C7"}}><MessageSquare size={20} color="#D97706"/></div>
            <div><div className="stat-label">Unread Messages</div><div className="stat-value mono">2</div><div className="stat-trend down">Needs response</div></div>
          </div>
        </div>

        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><div className="card-title">My Recent Homework</div></div>
          <div style={{overflowX:"auto"}}>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Due Date</th><th>Priority</th></tr></thead>
              <tbody>
                {mockHomework.filter(h=>h.postedBy===user.name).map(h=>(
                  <tr key={h.id}>
                    <td style={{fontWeight:500}}>{h.title}</td>
                    <td><span className="tag tag-blue">{h.class}</span></td>
                    <td>{h.subject}</td>
                    <td className="mono" style={{fontSize:12}}>{h.dueDate}</td>
                    <td><span className={`priority-${h.priority}`} style={{fontWeight:600,fontSize:12}}>{h.priority.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function ParentDashboard({ user }) {
  const fees = mockFees.filter(f=>f.studentId===user.childId);
  const overdueFees = fees.filter(f=>f.status==="overdue"||f.status==="partial");

  return (
    <>
      <Topbar title="Parent Dashboard"/>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Welcome, {user.name.split(" ")[0]} 👋</h1>
          <p className="page-subtitle">Viewing: <strong>{user.childName}</strong> — Class {user.childClass}</p>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#DCFCE7"}}><CheckSquare size={20} color="#15803D"/></div>
            <div><div className="stat-label">Today's Attendance</div><div className="stat-value">Present</div><div className="stat-trend">On time</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#EEF1FE"}}><BookOpen size={20} color="#1E3FF2"/></div>
            <div><div className="stat-label">Pending Homework</div><div className="stat-value mono">3</div><div className="stat-trend">Due this week</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:overdueFees.length?"#FEE2E2":"#DCFCE7"}}>
              <TrendingUp size={20} color={overdueFees.length?"#DC2626":"#15803D"}/>
            </div>
            <div>
              <div className="stat-label">Fee Status</div>
              <div className="stat-value">{overdueFees.length ? "Due" : "Paid"}</div>
              <div className={`stat-trend ${overdueFees.length?"down":""}`}>{overdueFees.length?"Outstanding balance":"All clear"}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:"#FEF3C7"}}><MessageSquare size={20} color="#D97706"/></div>
            <div><div className="stat-label">Unread Messages</div><div className="stat-value mono">1</div><div className="stat-trend">From teacher</div></div>
          </div>
        </div>

        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><div className="card-title">Upcoming Homework for {user.childClass}</div></div>
          <div style={{overflowX:"auto"}}>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Subject</th><th>Due Date</th><th>Priority</th></tr></thead>
              <tbody>
                {mockHomework.filter(h=>h.class===user.childClass).slice(0,4).map(h=>(
                  <tr key={h.id}>
                    <td style={{fontWeight:500}}>{h.title}</td>
                    <td>{h.subject}</td>
                    <td className="mono" style={{fontSize:12}}>{h.dueDate}</td>
                    <td><span className={`priority-${h.priority}`} style={{fontWeight:600,fontSize:12}}>{h.priority.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  if (currentUser.role === "teacher") return <TeacherDashboard user={currentUser}/>;
  if (currentUser.role === "parent") return <ParentDashboard user={currentUser}/>;
  return <AdminDashboard/>;
}

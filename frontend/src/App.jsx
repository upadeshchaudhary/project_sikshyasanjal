import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import TeachersPage from "./pages/TeachersPage";
import HomeworkPage from "./pages/HomeworkPage";
import AttendancePage from "./pages/AttendancePage";
import ResultsPage from "./pages/ResultsPage";
import NoticesPage from "./pages/NoticesPage";
import FeesPage from "./pages/FeesPage";
import MessagesPage from "./pages/MessagesPage";
import RoutinePage from "./pages/RoutinePage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import "./index.css";

function AppShell() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar/>
      <div className="main-area">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/dashboard" element={<DashboardPage/>}/>
          <Route path="/students" element={<StudentsPage/>}/>
          <Route path="/teachers" element={<TeachersPage/>}/>
          <Route path="/homework" element={<HomeworkPage/>}/>
          <Route path="/attendance" element={<AttendancePage/>}/>
          <Route path="/results" element={<ResultsPage/>}/>
          <Route path="/notices" element={<NoticesPage/>}/>
          <Route path="/fees" element={<FeesPage/>}/>
          <Route path="/messages" element={<MessagesPage/>}/>
          <Route path="/routine" element={<RoutinePage/>}/>
          <Route path="/calendar" element={<CalendarPage/>}/>
          <Route path="/settings" element={<SettingsPage/>}/>
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell/>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily:"'Sora',sans-serif", fontSize:"13px", borderRadius:"10px", border:"1px solid var(--border)" },
          success: { iconTheme: { primary:"var(--green)", secondary:"#fff" } }
        }}/>
      </BrowserRouter>
    </AppProvider>
  );
}

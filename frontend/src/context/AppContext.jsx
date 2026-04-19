import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

// ─── Seed notifications per role ─────────────────────────────────────────────
const SEED_NOTIFICATIONS = {
  admin: [
    { id:"n1", type:"fee",      title:"Fee overdue — Bikash Karki",       body:"Class 10B fee is 15 days overdue.",                time:"2 min ago",  read:false, link:"/fees" },
    { id:"n2", type:"message",  title:"New message from Rajesh Sharma",   body:"Question about Aarav's attendance record.",         time:"18 min ago", read:false, link:"/messages" },
    { id:"n3", type:"homework", title:"Homework posted — Sunita Koirala", body:"Quadratic Equations for 10A due 2082-01-20.",       time:"1 hr ago",   read:false, link:"/homework" },
    { id:"n4", type:"notice",   title:"Notice published",                 body:"Annual Sports Day notice is now live.",             time:"3 hrs ago",  read:true,  link:"/notices" },
    { id:"n5", type:"result",   title:"Exam results uploaded",            body:"First Term results for 10A uploaded.",              time:"Yesterday",  read:true,  link:"/results" },
    { id:"n6", type:"student",  title:"New student enrolled",             body:"Pooja Joshi added to class 7A.",                   time:"2 days ago", read:true,  link:"/students" },
  ],
  teacher: [
    { id:"n1", type:"message",  title:"Message from Rajesh Sharma",       body:"Asking about Aarav's maths performance.",           time:"5 min ago",  read:false, link:"/messages" },
    { id:"n2", type:"message",  title:"Message from Mohan Thapa",         body:"Query about English homework chapter 7.",           time:"1 hr ago",   read:false, link:"/messages" },
    { id:"n3", type:"notice",   title:"New school notice",                body:"Annual Sports Day announced for Falgun 15.",        time:"3 hrs ago",  read:true,  link:"/notices" },
    { id:"n4", type:"calendar", title:"Exam schedule reminder",           body:"Second term exams begin in 3 days.",                time:"Yesterday",  read:true,  link:"/calendar" },
  ],
  parent: [
    { id:"n1", type:"homework", title:"New homework assigned",            body:"Quadratic Equations due 2082-01-20 for 10A.",       time:"30 min ago", read:false, link:"/homework" },
    { id:"n2", type:"notice",   title:"Important school notice",          body:"Fee submission deadline is Falgun 25.",             time:"2 hrs ago",  read:false, link:"/notices" },
    { id:"n3", type:"message",  title:"Reply from Sunita Koirala",        body:"Aarav scored 88/100. Keep encouraging him.",        time:"Yesterday",  read:true,  link:"/messages" },
    { id:"n4", type:"result",   title:"Exam results published",           body:"First Term results are now available.",             time:"2 days ago", read:true,  link:"/results" },
  ],
};

// ─── Default settings ────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  notifyHomework:     true,
  notifyNotices:      true,
  notifyMessages:     true,
  notifyFees:         true,
  notifyResults:      true,
  notifyExamReminder: true,
  language:           "English",
  dateFormat:         "BS",
  theme:              "light",
  showPhone:          false,
  twoFactorOTP:       true,
  sessionTimeout:     "30",
  defaultClass:       "10A",
  academicYear:       "2082-83",
  schoolName:         "SikshyaSanjal Academy",
  schoolPhone:        "+977-1-4567890",
  schoolAddress:      "Kathmandu, Nepal",
  feeReminderDays:    "7",
  maxOTPAttempts:     "5",
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AppProvider = ({ children }) => {
  const [currentUser,   setCurrentUser]   = useState(null);
  const [school,        setSchool]        = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [settings,      setSettings]      = useState(DEFAULT_SETTINGS);

  const login = (user, schoolData) => {
    setCurrentUser(user);
    setSchool(schoolData);
    setNotifications(SEED_NOTIFICATIONS[user.role] || []);
  };

  const logout = () => {
    setCurrentUser(null);
    setSchool(null);
    setNotifications([]);
  };

  const markNotifRead    = (id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read:true } : n));
  const markAllRead      = ()   => setNotifications(p => p.map(n => ({ ...n, read:true })));
  const clearNotif       = (id) => setNotifications(p => p.filter(n => n.id !== id));
  const updateSetting    = (key, value) => setSettings(p => ({ ...p, [key]: value }));
  const unreadCount      = notifications.filter(n => !n.read).length;

  // Apply dark mode class to body whenever theme setting changes
  useEffect(() => {
    document.body.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  return (
    <AppContext.Provider value={{
      currentUser, school, login, logout,
      notifications, markNotifRead, markAllRead, clearNotif, unreadCount,
      settings, updateSetting,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

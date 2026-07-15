// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getCurrentAcademicYear } from "../utils/calendar";

const AppContext = createContext();

axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.timeout = 10000;

export const DEFAULT_SETTINGS = {
  notifyHomework:     true,
  notifyNotices:      true,
  notifyMessages:     true,
  notifyFees:         true,
  notifyResults:      true,
  notifyExamReminder: true,
  notifySMS:          false,
  notifyPush:         false,
  language:           "English",
  dateFormat:         "BS",
  theme:              "light",
  sidebarCollapsed:   false,
  hidePhone:          false,
  twoFactorOTP:       true,
  sessionTimeout:     "30",
  schoolName:         "SikshyaSanjal Academy",
  schoolPhone:        "+977-1-4567890",
  schoolAddress:      "Kathmandu, Nepal",
  feeReminderDays:    "7",
  maxOTPAttempts:     "5",
  academicYear:       getCurrentAcademicYear(),
  defaultClass:       "10A",
  paymentMethods:     ["Cash", "eSewa", "Khalti"],
  feeCategories:      ["Tuition Fee", "Exam Fee", "Sports Fee", "Library Fee", "Computer Lab Fee"],
};

function getSeedNotifications(user) {
  const role = user?.role || "parent";
  const base = [
    {
      id: "notif-1",
      type: "notice",
      title: "New notice posted",
      body: "The latest school notice is ready to review.",
      time: "Just now",
      read: false,
      link: "/notices",
    },
    {
      id: "notif-2",
      type: "message",
      title: "New message received",
      body: "A parent or teacher sent a new message.",
      time: "10 min ago",
      read: false,
      link: "/messages",
    },
  ];

  if (role === "admin") {
    return [
      ...base,
      {
        id: "notif-3",
        type: "student",
        title: "Attendance summary ready",
        body: "Review today's attendance overview for the school.",
        time: "1 hour ago",
        read: false,
        link: "/attendance",
      },
    ];
  }

  if (role === "teacher") {
    return [
      ...base,
      {
        id: "notif-3",
        type: "homework",
        title: "Homework reminder",
        body: "A new homework assignment was posted for your class.",
        time: "1 hour ago",
        read: false,
        link: "/homework",
      },
    ];
  }

  return [
    ...base,
    {
      id: "notif-3",
      type: "fee",
      title: "Fee reminder",
      body: "Your next fee installment is approaching its due date.",
      time: "2 hours ago",
      read: false,
      link: "/fees",
    },
  ];
}

function applyAxiosAuth(token) {
  axios.defaults.headers.common["Authorization"]   = `Bearer ${token}`;
}

function clearAxiosAuth() {
  delete axios.defaults.headers.common["Authorization"];
}

function clearStorage() {
  localStorage.removeItem("ss_token");
}

export const AppProvider = ({ children }) => {
  const [currentUser,   setCurrentUser]   = useState(null);
  const [school,        setSchool]        = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [settings,      setSettings]      = useState(DEFAULT_SETTINGS);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [offline,       setOffline]       = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);

  const restoringRef   = useRef(true);
  const currentUserRef = useRef(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ── Session restore ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    restoringRef.current = true;

    const restore = async () => {
      const token = localStorage.getItem("ss_token");

      if (!token) {
        restoringRef.current = false;
        if (!cancelled) setAuthLoading(false);
        return;
      }

      applyAxiosAuth(token);

      try {
        const { data } = await axios.get("/auth/me");
        if (cancelled) return;

        if (data.success && data.user && data.school) {
          setCurrentUser(data.user);
          currentUserRef.current = data.user;
          setSchool({ ...data.school, academicYear: getCurrentAcademicYear() });

          try {
            const savedSettings = localStorage.getItem("ss_settings");
            if (savedSettings) {
              const parsed = JSON.parse(savedSettings);
              parsed.academicYear = getCurrentAcademicYear();
              setSettings(s => ({ ...s, ...parsed }));
            }
          } catch { /* ignore corrupt settings */ }
        } else {
          clearStorage();
          clearAxiosAuth();
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401 || err.response?.status === 403) {
          clearStorage();
          clearAxiosAuth();
          if (err.response?.status === 403) {
            toast.error("Your account has been disabled. Contact the school administrator.");
          }
        }
      } finally {
        restoringRef.current = false;
        if (!cancelled) setAuthLoading(false);
      }
    };

    restore();
    return () => { cancelled = true; };
  }, []);

  // Load notifications when user changes
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const key = `ss_notifications_${currentUser._id || currentUser.id}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        setNotifications(getSeedNotifications(currentUser));
      }
    } else {
      const seeded = getSeedNotifications(currentUser);
      setNotifications(seeded);
      localStorage.setItem(key, JSON.stringify(seeded));
    }
  }, [currentUser]);

  // Save notifications
  useEffect(() => {
    if (!currentUser) return;
    const key = `ss_notifications_${currentUser._id || currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(notifications));
  }, [notifications, currentUser]);

  const getDismissedIds = useCallback(() => {
    if (!currentUserRef.current) return [];
    const key = `ss_dismissed_${currentUserRef.current._id || currentUserRef.current.id}`;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  const pollRealtimeUpdates = useCallback(async () => {
    if (!currentUserRef.current) return;
    const dismissedIds = getDismissedIds();

    // 1. Fetch conversations for messages
    try {
      const { data: convData } = await axios.get("/messages/conversations");
      if (convData.success && convData.conversations) {
        let totalUnread = 0;
        let newNotifs = [];
        let updatedSome = false;

        setNotifications(prevNotifs => {
          let updatedList = [...prevNotifs];

          convData.conversations.forEach(conv => {
            totalUnread += conv.unread || 0;

            if (conv.unread > 0 && settings.notifyMessages) {
              const notifId = `msg_${conv.userId}_${new Date(conv.timestamp).getTime()}`;
              // Check if we already have this notification or dismissed it
              const exists = updatedList.some(n => n.id === notifId) || dismissedIds.includes(notifId);
              if (!exists) {
                const newNotif = {
                  id: notifId,
                  type: "message",
                  title: `New message from ${conv.name}`,
                  body: conv.lastMessage || "A parent or teacher sent a new message.",
                  time: "Just now",
                  read: false,
                  link: "/messages",
                };
                updatedList = [newNotif, ...updatedList];
                newNotifs.push(newNotif);
                updatedSome = true;
              }
            } else if (conv.unread === 0) {
              // Auto-mark read
              const prefix = `msg_${conv.userId}_`;
              const hasUnreadNotif = updatedList.some(n => n.id.startsWith(prefix) && !n.read);
              if (hasUnreadNotif) {
                updatedList = updatedList.map(n => 
                  n.id.startsWith(prefix) ? { ...n, read: true } : n
                );
                updatedSome = true;
              }
            }
          });

          newNotifs.forEach(notif => {
            toast.success(notif.title, { id: notif.id, duration: 4000 });
          });

          return updatedSome ? updatedList : prevNotifs;
        });

        setUnreadMessagesCount(totalUnread);
      }
    } catch (err) {
      console.warn("Failed polling conversations:", err.message);
    }

    // 2. Fetch notices
    try {
      if (settings.notifyNotices) {
        const { data: noticeData } = await axios.get("/notices?limit=5");
        if (noticeData.success && noticeData.notices) {
          setNotifications(prevNotifs => {
            let updatedList = [...prevNotifs];
            let updatedSome = false;
            let newNotifs = [];

            noticeData.notices.forEach(notice => {
              const notifId = `notice_${notice._id}`;
              const exists = updatedList.some(n => n.id === notifId) || dismissedIds.includes(notifId);
              if (!exists) {
                const newNotif = {
                  id: notifId,
                  type: "notice",
                  title: `New notice posted`,
                  body: notice.title || "The latest school notice is ready to review.",
                  time: new Date(notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  read: false,
                  link: "/notices",
                };
                updatedList = [newNotif, ...updatedList];
                newNotifs.push(newNotif);
                updatedSome = true;
              }
            });

            newNotifs.forEach(notif => {
              toast.success(`New notice: ${notif.body}`, { id: notif.id, duration: 4000 });
            });

            return updatedSome ? updatedList : prevNotifs;
          });
        }
      }
    } catch (err) {
      console.warn("Failed polling notices:", err.message);
    }

    // 3. Fetch homework
    try {
      if (settings.notifyHomework) {
        const { data: hwData } = await axios.get("/homework?limit=5");
        if (hwData.success && hwData.homework) {
          setNotifications(prevNotifs => {
            let updatedList = [...prevNotifs];
            let updatedSome = false;
            let newNotifs = [];

            hwData.homework.forEach(hw => {
              const notifId = `hw_${hw._id}`;
              const exists = updatedList.some(n => n.id === notifId) || dismissedIds.includes(notifId);
              if (!exists) {
                const newNotif = {
                  id: notifId,
                  type: "homework",
                  title: `New homework assigned`,
                  body: `${hw.subject}: ${hw.title}`,
                  time: new Date(hw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  read: false,
                  link: "/homework",
                };
                updatedList = [newNotif, ...updatedList];
                newNotifs.push(newNotif);
                updatedSome = true;
              }
            });

            newNotifs.forEach(notif => {
              toast.success(notif.body, { id: notif.id, duration: 4000 });
            });

            return updatedSome ? updatedList : prevNotifs;
          });
        }
      }
    } catch (err) {
      console.warn("Failed polling homework:", err.message);
    }
  }, [settings.notifyMessages, settings.notifyNotices, settings.notifyHomework, getDismissedIds]);

  const fetchUnreadMessagesCount = useCallback(() => {
    pollRealtimeUpdates();
  }, [pollRealtimeUpdates]);

  useEffect(() => {
    if (currentUser) {
      pollRealtimeUpdates();
      const interval = setInterval(pollRealtimeUpdates, 8000);
      return () => clearInterval(interval);
    } else {
      setUnreadMessagesCount(0);
    }
  }, [currentUser, pollRealtimeUpdates]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        if (offline) setOffline(false);
        return response;
      },
      (error) => {
        if (!error.response) {
          setOffline(true);
        }

        if (
          error.response?.status === 401 &&
          !restoringRef.current &&
          currentUserRef.current !== null
        ) {
          clearStorage();
          clearAxiosAuth();
          setCurrentUser(null);
          currentUserRef.current = null;
          setSchool(null);
          setNotifications([]);
          setSettings(DEFAULT_SETTINGS);
          toast.error("Your session has expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [offline]); 

  const login = useCallback((token, user, schoolData) => {
    localStorage.setItem("ss_token",  token);
    applyAxiosAuth(token);
    setCurrentUser(user);
    currentUserRef.current = user;
    setSchool(schoolData ? { ...schoolData, academicYear: getCurrentAcademicYear() } : null);
    setNotifications([]);
  }, []);

  const updateUser = useCallback((userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
    currentUserRef.current = { ...currentUserRef.current, ...userData };
  }, []);

  const updateSchool = useCallback((schoolData) => {
    setSchool(prev => ({ ...prev, ...schoolData, academicYear: getCurrentAcademicYear() }));
  }, []);

  const handleLogout = useCallback(() => {
    clearStorage();
    clearAxiosAuth();
    setCurrentUser(null);
    currentUserRef.current = null;
    setSchool(null);
    setNotifications([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const markNotifRead   = useCallback((id) =>
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead     = useCallback(() =>
    setNotifications(p => p.map(n => ({ ...n, read: true }))), []);
  const clearNotif = useCallback((id) => {
    setNotifications(p => p.filter(n => n.id !== id));
    if (currentUserRef.current) {
      const key = `ss_dismissed_${currentUserRef.current._id || currentUserRef.current.id}`;
      try {
        const saved = localStorage.getItem(key);
        const dismissed = saved ? JSON.parse(saved) : [];
        if (!dismissed.includes(id)) {
          localStorage.setItem(key, JSON.stringify([...dismissed, id]));
        }
      } catch (e) {
        console.warn("Failed to store dismissed notification ID:", e);
      }
    }
  }, []);
  const addNotification = useCallback((notif) =>
    setNotifications(p => [notif, ...p]), []);
  const unreadCount = notifications.filter(n => !n.read).length;

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      next.academicYear = getCurrentAcademicYear();
      localStorage.setItem("ss_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  return (
    <AppContext.Provider value={{
      currentUser, school, authLoading, offline,
      login, logout: handleLogout, updateUser, updateSchool,
      notifications, markNotifRead, markAllRead,
      clearNotif, addNotification, unreadCount,
      unreadMessagesCount, fetchUnreadMessagesCount,
      settings, updateSetting,
      mobileOpen, setMobileOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
};

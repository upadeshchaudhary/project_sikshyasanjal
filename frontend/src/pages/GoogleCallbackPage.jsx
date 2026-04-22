import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function GoogleCallbackPage() {
  const [params]  = useSearchParams();
  const { login } = useApp();
  const navigate  = useNavigate();

  useEffect(() => {
    const payload = params.get("payload");
    if (!payload) return navigate("/?error=google_failed");
    try {
      const { token, user, school } = JSON.parse(
        atob(payload)
      );
      login(token, user, school);
      navigate("/dashboard");
    } catch {
      navigate("/?error=google_failed");
    }
  }, []);

  return <div className="auth-loading-screen"><div className="auth-spinner" /></div>;
}
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (
  typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
  !window.Capacitor
    ? "http://localhost:5000"
    : "https://wellcare-ai-backend.onrender.com"
);

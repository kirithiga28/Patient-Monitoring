import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { userData, logout } = useAuth();
  const [theme, setTheme] = useState("Dark");
  const [notifications, setNotifications] = useState("Enabled");

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl font-sans text-slate-100 animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          System Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize monitoring workspace preference and review profile metadata.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Workspace Tenant</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-slate-400 font-semibold">Hospital Name:</span> {userData?.hospitalName || "Well Care Hospital"}</p>
            <p><span className="text-slate-400 font-semibold">Hospital Code ID:</span> {userData?.hospitalId || "hosp_default"}</p>
            <p><span className="text-slate-400 font-semibold">Account Owner:</span> {userData?.name} ({userData?.role})</p>
            <p><span className="text-slate-400 font-semibold">Registered Email:</span> {userData?.email}</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            FCM Cloud Notification Alerts
          </label>
          <select 
            value={notifications}
            onChange={(e) => setNotifications(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs"
          >
            <option value="Enabled">Enabled (Browser Web Push + Audio alarms)</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Interface Theme Preference
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs"
          >
            <option value="Dark">Clinical Dark Theme</option>
            <option value="Light">Clinical Light Theme</option>
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full py-3 bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-950/60 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          Sign Out of System Session
        </button>
      </div>
    </div>
  );
}

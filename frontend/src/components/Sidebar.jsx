import React from "react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Sidebar({ currentPage, setPage, isOpen, onClose }) {
  const { logout, userData } = useAuth();

  const menuGroups = [
    {
      title: "Patient Management",
      items: [
        { id: "dashboard", label: "📊 Dashboard" },
        { id: "patients", label: "👨‍⚕️ Patients Directory" },
        { id: "patientprofile", label: "👤 Patient Profile" },
        { id: "doctorprofile", label: "👤 Doctor Profile" },
        { id: "medicalrecords", label: "📋 Medical Records" },
        { id: "patientvitals", label: "🩺 Patient Vitals" }
      ]
    },
    {
      title: "Clinical Monitoring",
      items: [
        { id: "livecameras", label: "📺 Live Monitoring" },
        { id: "icumonitoring", label: "🏥 ICU Monitoring" },
        { id: "observationward", label: "🚪 Observation Ward" },
        { id: "criticalpatient", label: "🚨 Critical Patient Monitor" },
        { id: "activityhistory", label: "🗄️ Activity History" }
      ]
    },
    {
      title: "Operations & System",
      items: [
        { id: "cameras", label: "📹 Camera Manager" },
        { id: "emergencyalerts", label: "🆘 Emergency Alerts" },
        { id: "notificationcenter", label: "🔔 Notification Center" },
        { id: "reports", label: "📄 Reports" },
        { id: "settings", label: "⚙️ Settings" }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[75%] max-w-[280px] bg-slate-950 border-r border-slate-900 text-slate-100 min-h-screen p-5 flex flex-col justify-between font-sans max-h-screen transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:flex ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="space-y-5 overflow-hidden flex flex-col h-full">
          
          {/* Header Logo */}
          <div className="flex flex-col items-center pb-4 border-b border-slate-900 shrink-0 relative">
            {/* Close button for mobile inside sidebar */}
            <button
              onClick={onClose}
              className="absolute right-0 top-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 md:hidden transition cursor-pointer"
              aria-label="Close sidebar"
            >
              ✕
            </button>
            <img
              src={logo}
              alt="Well Care Logo"
              className="w-12 h-12 mb-1 rounded-xl shadow-lg border border-slate-900"
            />
            <h2 className="text-sm font-extrabold text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Well Care Hospital
            </h2>
            <p className="text-[9px] text-slate-500 text-center tracking-widest font-black uppercase mt-0.5">
              Monitoring System
            </p>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 pb-6">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 block px-2 select-none">
                  {group.title}
                </span>

                <ul className="space-y-0.5 mt-1">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => setPage(item.id)}
                      className={`cursor-pointer px-3 py-2 rounded-lg text-[11px] font-semibold tracking-wide flex items-center transition select-none ${
                        currentPage === item.id 
                          ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/10" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                      }`}
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Profile */}
        <div className="pt-4 border-t border-slate-900 text-center shrink-0">
          <p className="text-[10px] text-slate-500 font-medium">Logged in as:</p>
          <p className="text-xs font-extrabold text-slate-300 truncate">{userData?.name || "Dr. Rajesh Mehta"}</p>
          <button
            onClick={logout}
            className="w-full mt-2 py-1.5 text-[9px] font-black uppercase tracking-wider bg-slate-900 hover:bg-red-950/20 hover:text-red-400 rounded-lg text-slate-400 transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Sidebar({ currentPage, setPage }) {
  const { role: authRole, logout, userData } = useAuth();
  const role = authRole || userData?.role || "caregiver";

  const [openCategories, setOpenCategories] = useState({
    "Patient Management": true,
    "Monitoring & AI": true
  });

  const toggleCategory = (title) => {
    setOpenCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const categories = [
    {
      title: "Patient Management",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "patients", label: "👨‍⚕️ Patients Directory", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "patientprofile", label: "👤 Patient Profile", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "addpatient", label: "➕ Register Patient", roles: ["super_admin", "hospital_admin", "nurse"] },
        { id: "medicalrecords", label: "📋 Medical Records", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "patientvitals", label: "🩺 Patient Vitals", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
      ]
    },
    {
      title: "Monitoring & AI",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "livecameras", label: "📺 Live Monitoring", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "testing", label: "🧪 Pose Testing Suite", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "predictions", label: "🧠 AI Prediction Matrix", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "icumonitoring", label: "🏥 ICU Monitoring", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "observationward", label: "🚪 Observation Ward", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "criticalpatient", label: "🚨 Critical Patient Monitor", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "activityhistory", label: "🗄️ Activity History", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
      ]
    },
    {
      title: "Clinical Operations",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "dashboard", label: "📊 Dashboard", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "cameras", label: "📹 Cameras Manager", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "alerts", label: "🚨 Alerts Incident Log", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "emergencyalerts", label: "🆘 Emergency Alerts", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "notificationcenter", label: "🔔 Notification Center", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "appointments", label: "📅 Appointments Book", roles: ["super_admin", "hospital_admin", "doctor"] }
      ]
    },
    {
      title: "Administration",
      roles: ["super_admin", "hospital_admin", "doctor"],
      items: [
        { id: "doctors", label: "👨‍⚕️ Doctor Registry", roles: ["super_admin", "hospital_admin"] },
        { id: "nurses", label: "👩‍⚕️ Nurse Staff Registry", roles: ["super_admin", "hospital_admin"] },
        { id: "bedmanagement", label: "🛏️ Bed Management", roles: ["super_admin", "hospital_admin"] },
        { id: "staffmanagement", label: "👥 Staff Management", roles: ["super_admin", "hospital_admin"] },
        { id: "usermanagement", label: "👤 User Management", roles: ["super_admin", "hospital_admin"] },
        { id: "devicemanagement", label: "🔌 Device Management", roles: ["super_admin", "hospital_admin"] },
        { id: "analytics", label: "📈 Analytics Dashboard", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "reports", label: "📄 Reports & Audits", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] }
      ]
    },
    {
      title: "System",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "settings", label: "⚙️ Settings", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "mobileqr", label: "📱 Mobile Access QR", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "auditlogs", label: "📝 Audit Logs", roles: ["super_admin", "hospital_admin"] },
        { id: "systemoverview", label: "💾 System Overview", roles: ["super_admin", "hospital_admin"] }
      ]
    }
  ];

  const visibleCategories = categories.filter(cat => cat.roles.includes(role));

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 text-slate-100 min-h-screen p-5 flex flex-col justify-between font-sans max-h-screen">
      <div className="space-y-6 overflow-hidden flex flex-col h-full">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center pb-4 border-b border-slate-900 shrink-0">
          <img
            src={logo}
            alt="Well Care Logo"
            className="w-12 h-12 mb-1 rounded-xl shadow-lg border border-slate-900"
          />
          <h2 className="text-base font-extrabold text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Well Care Hospital
          </h2>
          <p className="text-[9px] text-slate-400 text-center tracking-widest font-black uppercase mt-0.5">
            {userData?.hospitalId || "AI Patient Monitor"}
          </p>
        </div>

        {/* Collapsible Category Navigation Items */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-6">
          {visibleCategories.map((cat) => {
            const isOpen = !!openCategories[cat.title];
            const visibleItems = cat.items.filter(item => item.roles.includes(role));

            if (visibleItems.length === 0) return null;

            return (
              <div key={cat.title} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.title)}
                  className="w-full flex justify-between items-center text-left py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 transition duration-150 select-none cursor-pointer"
                >
                  <span>{cat.title}</span>
                  <span className="text-[8px] transform transition duration-150" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                    ▶
                  </span>
                </button>

                {/* Sub Menu Items list */}
                {isOpen && (
                  <ul className="pl-2.5 border-l border-slate-900 space-y-1 mt-1 transition-all duration-150">
                    {visibleItems.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => setPage(item.id)}
                        className={`cursor-pointer px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wide flex items-center transition select-none ${
                          currentPage === item.id 
                            ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/10" 
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                        }`}
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Profile */}
      <div className="pt-4 border-t border-slate-900 text-center shrink-0">
        <p className="text-[10px] text-slate-500 font-medium">Logged in as:</p>
        <p className="text-xs font-extrabold text-slate-300 truncate">{userData?.name || "Active Session"}</p>
        <button
          onClick={logout}
          className="w-full mt-2 py-1.5 text-[9px] font-black uppercase tracking-wider bg-slate-900 hover:bg-red-950/20 hover:text-red-400 rounded-lg text-slate-400 transition cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
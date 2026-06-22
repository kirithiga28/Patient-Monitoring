import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Sidebar({ currentPage, setPage }) {
  const { role: authRole, logout, userData } = useAuth();
  const role = authRole || userData?.role || "caregiver";

  // Collapsible categories state (first folder is open by default)
  const [openCategories, setOpenCategories] = useState({
    "🏥 Hospital Core": true
  });

  const toggleCategory = (title) => {
    setOpenCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Nav schema grouped in collapsible categories
  const categories = [
    {
      title: "🏥 Hospital Core",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "dashboard", label: "📊 Dashboard", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "patients", label: "👨‍⚕️ Patients Directory", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "alerts", label: "🚨 Alerts Incident Log", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "cameras", label: "📹 Cameras Manager", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "testing", label: "🧪 Pose Testing Suite", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "settings", label: "⚙️ System Settings", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
      ]
    },
    {
      title: "🏢 Hospital Administration",
      roles: ["super_admin", "hospital_admin"],
      items: [
        { id: "admindashboard", label: "📊 Admin Dashboard", roles: ["super_admin", "hospital_admin"] },
        { id: "hospitalmanagement", label: "🏨 Hospital Config", roles: ["super_admin", "hospital_admin"] },
        { id: "departmentmanagement", label: "🏬 Department Registry", roles: ["super_admin", "hospital_admin"] },
        { id: "roommanagement", label: "🚪 Room Management", roles: ["super_admin", "hospital_admin"] },
        { id: "bedmanagement", label: "🛏️ Bed Inventory", roles: ["super_admin", "hospital_admin"] },
        { id: "usermanagement", label: "👥 User Accounts", roles: ["super_admin", "hospital_admin"] },
        { id: "rolepermissions", label: "🔑 Permission Matrix", roles: ["super_admin", "hospital_admin"] }
      ]
    },
    {
      title: "⚕️ Clinical Patient Care",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "admission", label: "➕ Admission Records", roles: ["super_admin", "hospital_admin", "nurse"] },
        { id: "discharge", label: "➖ Clinical Discharges", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "transfer", label: "🔄 Room Transfers", roles: ["super_admin", "hospital_admin", "nurse"] },
        { id: "medicalhistory", label: "📋 Medical Histories", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "vitalsmonitoring", label: "🩺 Vitals Telemetry", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "prescriptions", label: "💊 Prescriptions List", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "treatmentplan", label: "📝 Treatment Programs", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "labreports", label: "🔬 Lab Diagnostics", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "scanreports", label: "📷 Imaging Scans", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "emergencyprofile", label: "🚨 Resuscitation Cards", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
      ]
    },
    {
      title: "🩺 Medical Staff Console",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse"],
      items: [
        { id: "doctors", label: "👨‍⚕️ Doctors Directory", roles: ["super_admin", "hospital_admin"] },
        { id: "nurses", label: "👩‍⚕️ Nurses Directory", roles: ["super_admin", "hospital_admin"] },
        { id: "doctorschedule", label: "📅 Physician Schedules", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "doctorappointments", label: "👥 Appointments Book", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "doctornotes", label: "✍️ Daily Round Notes", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "consultations", label: "🗂️ Case Consultations", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "nurseassignments", label: "📋 Nurse Board", roles: ["super_admin", "hospital_admin", "nurse"] },
        { id: "nurseshifts", label: "⏰ Nurse Shift Rosters", roles: ["super_admin", "hospital_admin", "nurse"] },
        { id: "mar", label: "📒 MAR Med Records", roles: ["super_admin", "hospital_admin", "nurse"] }
      ]
    },
    {
      title: "🤖 AI Monitoring Telemetry",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "predictions", label: "🧠 AI Prediction Matrix", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "activityanalytics", label: "📊 Pose Analytics", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "fallcenter", label: "🚨 Fall Control Center", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "abnormalreview", label: "⚠️ Anomaly Reviews", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "incidentinvestigation", label: "🔍 Incident Audits", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "camera-wall", label: "🖼️ Multi-Camera Wall", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "detectionhistory", label: "🗄️ AI Detection Log", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
      ]
    },
    {
      title: "🚨 Emergency Bay",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "emergencycenter", label: "🆘 Emergency Desk", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "codeblue", label: "🔴 Code Blue Alerts", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "ambulances", label: "🚑 Ambulance Tracker", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
      ]
    },
    {
      title: "📈 Hospital Analytics",
      roles: ["super_admin", "hospital_admin", "doctor"],
      items: [
        { id: "reports", label: "📄 Reports & Audits", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
        { id: "hospitalanalytics", label: "📈 Clinical Metrics", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "occupancyanalytics", label: "📊 Occupancy Trends", roles: ["super_admin", "hospital_admin"] },
        { id: "recoveryanalytics", label: "🌱 Recovery Stats", roles: ["super_admin", "hospital_admin", "doctor"] },
        { id: "accuracyanalytics", label: "🤖 AI Accuracy Hub", roles: ["super_admin", "hospital_admin"] }
      ]
    },
    {
      title: "💬 Communication",
      roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"],
      items: [
        { id: "messaging", label: "💬 Rounding Chat", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "announcements", label: "📢 Board Announcements", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
        { id: "notificationcenter", label: "🔔 System Notifications", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
      ]
    },
    {
      title: "⚙️ System Configs",
      roles: ["super_admin", "hospital_admin"],
      items: [
        { id: "auditlogs", label: "📝 Audit Logs Trail", roles: ["super_admin", "hospital_admin"] },
        { id: "backups", label: "💾 Backup Archives", roles: ["super_admin", "hospital_admin"] },
        { id: "apiconfig", label: "🔌 System API Keys", roles: ["super_admin", "hospital_admin"] },
        { id: "securitymonitoring", label: "🛡️ Firewall Logs", roles: ["super_admin", "hospital_admin"] }
      ]
    }
  ];

  // Filter categories by user role access
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
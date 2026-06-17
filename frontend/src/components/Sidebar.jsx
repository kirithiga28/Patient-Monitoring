import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Sidebar({ currentPage, setPage }) {
  const { role: authRole, logout, userData } = useAuth();
  const role = authRole || userData?.role || "caregiver";

  // Navigation schema depending on user role permissions
  const navItems = [
    { id: "dashboard", label: "📊 Dashboard", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
    { id: "patients", label: "👨‍⚕️ Patients Directory", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
    { id: "addpatient", label: "➕ Register Patient", roles: ["super_admin", "hospital_admin", "nurse"] },
    { id: "alerts", label: "🚨 Alerts Incident Log", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
    { id: "reports", label: "📄 Reports & Audits", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
    { id: "predictions", label: "🧠 AI Prediction Matrix", roles: ["super_admin", "hospital_admin", "doctor"] },
    { id: "cameras", label: "📹 Cameras Manager", roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
    { id: "testing", label: "🧪 Pose Testing Suite", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
    { id: "doctors", label: "🩺 Doctor Registry", roles: ["super_admin", "hospital_admin"] },
    { id: "nurses", label: "👩‍⚕️ Nurse Staff Registry", roles: ["super_admin", "hospital_admin"] },
    { id: "settings", label: "⚙️ System Settings", roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 text-slate-100 min-h-screen p-5 flex flex-col justify-between font-sans">
      <div className="space-y-6">
        <div className="flex flex-col items-center pb-6 border-b border-slate-900">
          <img
            src={logo}
            alt="Well Care Logo"
            className="w-16 h-16 mb-2 rounded-2xl shadow-lg border border-slate-900"
          />
          <h2 className="text-lg font-extrabold text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Well Care Hospital
          </h2>
          <p className="text-[10px] text-slate-400 text-center tracking-widest font-black uppercase mt-0.5">
            {userData?.hospitalId || "AI Patient Monitor"}
          </p>
        </div>

        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`cursor-pointer px-4 py-3 rounded-xl text-xs font-semibold tracking-wide flex items-center transition select-none ${
                currentPage === item.id 
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/10" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t border-slate-900 text-center space-y-2">
        <p className="text-[10px] text-slate-500 font-medium">Logged in as:</p>
        <p className="text-xs font-extrabold text-slate-300 truncate">{userData?.name || "Active Session"}</p>
        <button
          onClick={logout}
          className="w-full mt-2 py-2 text-[10px] font-bold bg-slate-900 hover:bg-red-950/20 hover:text-red-400 rounded-lg text-slate-400 transition cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
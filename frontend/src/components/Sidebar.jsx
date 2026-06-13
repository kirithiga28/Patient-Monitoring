import logo from "../assets/logo.png";

export default function Sidebar({ setPage }) {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-5">
      <div className="flex flex-col items-center mb-8">
        <img
          src={logo}
          alt="Hospital Logo"
          className="w-20 h-20 mb-3"
        />

        <h2 className="text-xl font-bold text-center">
          Well Care Hospital
        </h2>

        <p className="text-xs text-gray-300 text-center">
          AI Patient Monitoring
        </p>
      </div>

      <ul className="space-y-5">
        <li
          className="cursor-pointer hover:text-blue-400"
          onClick={() => setPage("dashboard")}
        >
          📊 Dashboard
        </li>

        <li
          className="cursor-pointer hover:text-blue-400"
          onClick={() => setPage("patients")}
        >
          👨‍⚕️ Patients
        </li>

        <li
          className="cursor-pointer hover:text-blue-400"
          onClick={() => setPage("addpatient")}
        >
          ➕ Add Patient
        </li>

        <li
          className="cursor-pointer hover:text-blue-400"
          onClick={() => setPage("alerts")}
        >
          🚨 Alerts
        </li>

        <li
          className="cursor-pointer hover:text-blue-400"
          onClick={() => setPage("reports")}
        >
          📄 Reports
        </li>

        <li
          className="cursor-pointer hover:text-blue-400"
          onClick={() => setPage("predictions")}
        >
          🧠 AI Predictions
        </li>

        <li
          className="cursor-pointer hover:text-blue-400"
          onClick={() => setPage("settings")}
        >
          ⚙ Settings
        </li>
      </ul>
    </div>
  );
}
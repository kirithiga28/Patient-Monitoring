import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { alertService } from "../services/alertService";
import { formatDateTime } from "../utils/dateFormatter";

export default function Alerts() {
  const { currentUser, role, hospitalId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [resolveNotes, setResolveNotes] = useState("");
  const [activeResolveId, setActiveResolveId] = useState(null);

  useEffect(() => {
    const unsubscribe = alertService.listenAlerts(role, hospitalId, (alertList) => {
      setAlerts(alertList);
    });

    return () => unsubscribe();
  }, [role, hospitalId]);

  const handleAcknowledge = async (alertId) => {
    try {
      await alertService.acknowledgeAlert(alertId, currentUser.uid);
      alert("Alert Acknowledged");
    } catch (error) {
      console.error(error);
      alert("Failed to acknowledge alert");
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!activeResolveId) return;

    try {
      await alertService.resolveAlert(activeResolveId, currentUser.uid, resolveNotes);
      alert("Alert Resolved");
      setActiveResolveId(null);
      setResolveNotes("");
    } catch (error) {
      console.error(error);
      alert("Failed to resolve alert");
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const statusMatch = filterStatus === "All" || alert.status === filterStatus;
    const severityMatch = filterSeverity === "All" || alert.severity === filterSeverity;
    return statusMatch && severityMatch;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AI Alert Incident Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time abnormal human activity incident detection.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div>
            <span className="text-slate-500 font-semibold uppercase mr-2 text-[10px]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-850 p-2 rounded-xl outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <span className="text-slate-500 font-semibold uppercase mr-2 text-[10px]">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-855 p-2 rounded-xl outline-none focus:border-blue-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {activeResolveId && (
        <form onSubmit={handleResolve} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold">⚠️ Document Incident Resolution Notes</h2>
          <textarea
            required
            placeholder="Document observations and treatment actions taken..."
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500 h-24 text-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Confirm Resolve
            </button>
            <button
              type="button"
              onClick={() => setActiveResolveId(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-900/40 rounded-2xl border border-slate-850 text-slate-500">
            <span className="text-5xl mb-2">🎉</span>
            <p className="text-lg font-bold">No Active Alerts</p>
            <p className="text-xs text-slate-600 mt-1">All incidents are currently acknowledged or resolved.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border bg-slate-900/80 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-slate-750 ${
                alert.status === "Resolved" ? "border-slate-850 opacity-60" :
                alert.severity === "Critical" ? "border-l-8 border-l-red-500 border-slate-800" :
                alert.severity === "High" ? "border-l-8 border-l-orange-500 border-slate-800" :
                alert.severity === "Medium" ? "border-l-8 border-l-yellow-500 border-slate-800" :
                "border-l-8 border-l-blue-500 border-slate-800"
              }`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    alert.severity === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    alert.severity === "High" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                    alert.severity === "Medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {alert.severity} Severity
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    alert.status === "Open" ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" :
                    alert.status === "Acknowledged" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}>
                    {alert.status}
                  </span>
                </div>

                <p className="font-extrabold text-lg text-slate-100">
                  {alert.alertType} - Room {alert.room}
                </p>

                <p className="text-xs text-slate-400">
                  Patient: <span className="font-semibold text-slate-300">{alert.patientName}</span> • Recorded: {formatDateTime(alert.timestamp)}
                </p>
                
                {alert.notes && (
                  <p className="text-xs text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 mt-2">
                    <span className="font-semibold text-slate-400">Resolution Notes:</span> {alert.notes}
                  </p>
                )}
              </div>

              {alert.status !== "Resolved" && role !== "caregiver" && (
                <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                  {alert.status === "Open" && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveResolveId(alert.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Resolve Alert
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

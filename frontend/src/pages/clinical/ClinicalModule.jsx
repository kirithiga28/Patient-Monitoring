import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { alertService } from "../../services/alertService";
import { notificationService } from "../../services/notificationService";
import { DataTable } from "../../components/ui/DataTable";

// 1. Emergency Alerts Command (Code Blue & Critical Incidents Only)
export function EmergencyAlerts() {
  const { hospitalId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return alertService.listenAlerts("doctor", hospitalId, (list) => {
      setAlerts(list);
      setLoading(false);
    });
  }, [hospitalId]);


  const columns = [
    { key: "id", label: "Alert ID", render: (row) => <span className="font-mono text-[10px] text-slate-400">{row.id || "N/A"}</span> },
    { key: "room", label: "Room Number" },
    { key: "alertType", label: "Alert Type", render: (row) => <span className="font-semibold text-red-400">{row.alertType}</span> },
    {
      key: "severity",
      label: "Severity",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
          row.severity === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" :
          row.severity === "High" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
          "bg-slate-800 text-slate-400 border-slate-700"
        }`}>
          {row.severity || "High"}
        </span>
      )
    },
    { key: "timestamp", label: "Alert Time", render: (row) => <span>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "N/A"}</span> },
    {
      key: "status",
      label: "Alert Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Open" ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" : "bg-slate-950 text-slate-400 border border-slate-850"
        }`}>
          {row.status || "Open"}
        </span>
      )
    },
    { key: "createdBy", label: "Created By", render: (row) => <span className="text-slate-400">{row.createdBy || "System"}</span> }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Emergency Alerts Command</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time status of critical room emergencies, telemetry alerts, and alarm logs from the backend.</p>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        searchKey="patientName"
        searchPlaceholder="Search by patient name..."
        loading={loading}
        emptyMessage="No Emergency Alerts Available"
      />
    </div>
  );
}

// 2. Notification Center
export function NotificationCenter() {
  const { hospitalId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return notificationService.listenNotifications(hospitalId, (list) => {
      setNotifications(list);
      setLoading(false);
    });
  }, [hospitalId]);

  // Columns for NotificationCenter DataTable
  const columns = [
    { 
      key: "type", 
      label: "Event Type",
      render: (row) => {
        let typeColor = "text-slate-400 bg-slate-950 border border-slate-850";
        if (row.type === "Critical Patient Created" || row.type === "Emergency Alert Created") {
          typeColor = "text-red-400 bg-red-950/20 border border-red-500/25 font-bold animate-pulse";
        } else if (row.type === "Patient Added") {
          typeColor = "text-green-400 bg-green-950/20 border border-green-500/25";
        } else if (row.type === "Patient Updated" || row.type === "Medical Record Updated") {
          typeColor = "text-blue-400 bg-blue-950/20 border border-blue-500/25";
        } else if (row.type === "Vital Signs Updated") {
          typeColor = "text-cyan-400 bg-cyan-950/20 border border-cyan-500/25";
        }
        
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] tracking-wide uppercase ${typeColor}`}>
            {row.type}
          </span>
        );
      }
    },
    { key: "message", label: "Description", className: "font-semibold text-slate-200" },
    { 
      key: "timestamp", 
      label: "Time", 
      render: (row) => <span className="font-mono text-slate-400">{row.timestamp ? new Date(row.timestamp).toLocaleString() : "N/A"}</span> 
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Notification Center</h1>
        <p className="text-slate-400 text-xs mt-1">Consolidated hub tracking all real-time events, system logs, and staff actions.</p>
      </div>

      <DataTable
        columns={columns}
        data={notifications}
        searchKey="message"
        searchPlaceholder="Search notifications..."
        loading={loading}
        emptyMessage="No Notifications Available"
      />
    </div>
  );
}

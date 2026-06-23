import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { emergencyService } from "../../services/emergencyService";
import { alertService } from "../../services/alertService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";

// 1. Emergency Alerts Command (Code Blue & Critical Incidents Only)
export function EmergencyAlerts() {
  const { hospitalId } = useAuth();
  const [codeBlues, setCodeBlues] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Code Blue alerts
    const unsubCB = emergencyService.listenCodeBlue(hospitalId, (list) => {
      setCodeBlues(list);
    });

    // Listen to all telemetry/critical alerts
    const unsubAlerts = alertService.listenAlerts("doctor", hospitalId, (list) => {
      setActiveAlerts(list.filter(a => a.severity === "Critical" || a.severity === "High"));
      setLoading(false);
    });

    return () => {
      unsubCB();
      unsubAlerts();
    };
  }, [hospitalId]);

  const activeEmergencyCount = codeBlues.filter(c => c.status !== "Resolved").length + 
    activeAlerts.filter(a => a.status === "Open").length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Emergency Alerts Command</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time status of critical room emergencies, active Code Blue alarms, and telemetry alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Active Code Blue Wards" value={codeBlues.filter(c => c.status !== "Resolved").length} icon="🚨" color="red" />
        <StatCard title="Active Critical Telemetry Alerts" value={activeAlerts.filter(a => a.status === "Open").length} icon="⚡" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Ward Emergencies */}
        <Card className="border-t-4 border-t-red-600 bg-slate-900 border border-slate-800">
          <CardHeader>
            <CardTitle>Active Ward Emergencies (Code Blue)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {codeBlues.map(cb => (
              <div key={cb.id} className="flex justify-between items-start bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <div>
                  <span className="font-extrabold text-white text-xs block">{cb.location}</span>
                  <span className="text-[10px] text-red-400 block mt-0.5">{cb.responseTeam}</span>
                  {cb.notes && <span className="text-[10px] text-slate-500 mt-1 block">Notes: {cb.notes}</span>}
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  cb.status === "Resolved" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                }`}>
                  {cb.status}
                </span>
              </div>
            ))}
            {codeBlues.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-8">No active Code Blue emergencies recorded.</p>
            )}
          </CardContent>
        </Card>

        {/* Telemetry Critical Alerts */}
        <Card className="border-t-4 border-t-amber-600 bg-slate-900 border border-slate-800">
          <CardHeader>
            <CardTitle>Critical Telemetry Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAlerts.map(a => (
              <div key={a.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <div>
                  <span className="font-extrabold text-white text-xs block">Room {a.room} - {a.patientName}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Alert Type: {a.alertType} • Severity: {a.severity}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  a.status === "Resolved" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
            {activeAlerts.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-8">No critical telemetry alerts logged.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 2. Notification Center
export function NotificationCenter() {
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
    { key: "patientName", label: "Patient" },
    { key: "alertType", label: "Incident Alert Title", className: "font-bold text-red-400" },
    { key: "room", label: "Room" },
    { key: "severity", label: "Severity" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Open" ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" : "bg-slate-950 text-slate-400 border border-slate-850"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Notification Center</h1>
        <p className="text-slate-400 text-xs mt-1">Consolidated hub tracking all telemetry alarms and active ward alerts.</p>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        searchKey="patientName"
        searchPlaceholder="Search notifications..."
        loading={loading}
        emptyMessage="No Notifications Available"
      />
    </div>
  );
}

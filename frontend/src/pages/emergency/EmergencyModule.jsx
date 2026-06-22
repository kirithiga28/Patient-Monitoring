import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { emergencyService } from "../../services/emergencyService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";

// 31. Emergency Response Center
export function EmergencyResponseCenter() {
  const { hospitalId } = useAuth();
  const [codeBlues, setCodeBlues] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCB = emergencyService.listenCodeBlue(hospitalId, (list) => setCodeBlues(list));
    const unsubAmb = emergencyService.listenAmbulances(hospitalId, (list) => {
      setAmbulances(list);
      setLoading(false);
    });
    return () => {
      unsubCB();
      unsubAmb();
    };
  }, [hospitalId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Emergency Response Control Desk</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time status of critical room emergencies, active Code Blue alarms, and en-route ambulances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Active Code Blue Incidents" value={codeBlues.filter(c => c.status !== "Resolved").length} icon="🚨" color="red" />
        <StatCard title="En-Route Ambulances" value={ambulances.filter(a => a.status === "En Route").length} icon="🚑" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-red-600">
          <CardHeader>
            <CardTitle>Active Ward Emergencies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {codeBlues.map(cb => (
              <div key={cb.id} className="flex justify-between items-start bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <div>
                  <span className="font-extrabold text-white text-xs block">{cb.location}</span>
                  <span className="text-[10px] text-red-400 block mt-0.5">{cb.responseTeam}</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Notes: {cb.notes}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  cb.status === "Resolved" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                }`}>
                  {cb.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-600">
          <CardHeader>
            <CardTitle>Ambulance Dispatch Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ambulances.map(a => (
              <div key={a.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <div>
                  <span className="font-extrabold text-white text-xs block">{a.vehicleNumber} ({a.driver})</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">ETA: {a.ETA} • Destination: {a.destination}</span>
                </div>
                <span className="text-[10px] font-bold text-amber-400">{a.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 32. Code Blue Alerts
export function CodeBlueAlerts() {
  const { hospitalId } = useAuth();
  const [codeBlues, setCodeBlues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return emergencyService.listenCodeBlue(hospitalId, (list) => {
      setCodeBlues(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "location", label: "Location/Ward Room" },
    { key: "responseTeam", label: "Assigned Response Team", className: "font-bold text-red-400" },
    { key: "startTime", label: "Incident Start Time" },
    { key: "duration", label: "Response Duration" },
    {
      key: "status",
      label: "Alert Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Resolved" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
        }`}>
          {row.status}
        </span>
      )
    },
    { key: "notes", label: "Notes" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Code Blue Alerts Registry</h1>
        <p className="text-slate-400 text-xs mt-1">Audit active alarms, response durations, and clinical notes logs.</p>
      </div>

      <DataTable
        columns={columns}
        data={codeBlues}
        searchKey="location"
        searchPlaceholder="Search location..."
        loading={loading}
      />
    </div>
  );
}

// 33. Ambulance Coordination
export function AmbulanceCoordination() {
  const { hospitalId } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return emergencyService.listenAmbulances(hospitalId, (list) => {
      setAmbulances(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "vehicleNumber", label: "Ambulance Vehicle ID" },
    { key: "driver", label: "Driver Name" },
    { key: "currentLocation", label: "Current Location Track" },
    { key: "ETA", label: "ETA to Destination" },
    { key: "destination", label: "Hospital Destination Bay" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "En Route" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" : "bg-slate-950 text-slate-400 border border-slate-850"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Ambulance Dispatch & Coordination</h1>
        <p className="text-slate-400 text-xs mt-1">Dispatch vehicles, check current GPS logs, and view ETA status cards.</p>
      </div>

      <DataTable
        columns={columns}
        data={ambulances}
        searchKey="vehicleNumber"
        searchPlaceholder="Search vehicle ID..."
        loading={loading}
      />
    </div>
  );
}

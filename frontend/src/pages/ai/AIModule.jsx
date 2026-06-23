import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import WebcamStream from "../../components/WebcamStream";
import { patientService } from "../../services/patientService";
import { activityService } from "../../services/activityService";

// 9. Live Camera Monitoring
export function LiveCameraMonitoring() {
  const { hospitalId } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients("doctor", hospitalId, null, null, (list) => {
      setPatients(list);
      setLoading(false);
    });
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-sm">Initiating live monitoring wall...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Live Monitoring Wall</h1>
        <p className="text-slate-400 text-xs mt-1">Multi-camera wall layout rendering real-time camera feeds and device streams.</p>
      </div>

      {patients.length === 0 ? (
        <div className="p-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-center text-slate-500 text-sm">
          No patients registered in the hospital directory. All feeds standby.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((p) => (
            <Card key={p.id} className="overflow-hidden bg-slate-900 border border-slate-800">
              <CardHeader>
                <CardTitle>Room {p.room} - {p.name}</CardTitle>
              </CardHeader>
              <div className="aspect-video bg-black relative">
                <WebcamStream compact patientId={p.id} patientName={p.name} roomCode={p.room} hospitalId={hospitalId} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// 10. Activity History (Activity History Logs)
export function ActivityHistory() {
  const { hospitalId } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return activityService.listenActivities("doctor", hospitalId, (list) => {
      setHistory(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "activity", label: "Logged Patient Activity", className: "font-bold text-green-400" },
    { key: "confidence", label: "Confidence Score" },
    { key: "timestamp", label: "Timestamp", className: "font-mono text-slate-400", render: (row) => row.timestamp ? new Date(row.timestamp).toLocaleString() : "--" }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Activity History Logs</h1>
        <p className="text-slate-400 text-xs mt-1">Review historical patient activities, alerts, monitoring logs, and camera events.</p>
      </div>

      <DataTable
        columns={columns}
        data={history}
        searchKey="patientName"
        searchPlaceholder="Search logs..."
        loading={loading}
        emptyMessage="No Patient Activity Logs Available"
      />
    </div>
  );
}

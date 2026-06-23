import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import WebcamStream from "../../components/WebcamStream";

// 9. Live Camera Monitoring
export function LiveCameraMonitoring() {
  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Live Monitoring Wall</h1>
        <p className="text-slate-400 text-xs mt-1">Multi-camera wall layout rendering real-time camera feeds and device streams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Room 101 - Aarav Sharma</CardTitle>
          </CardHeader>
          <div className="aspect-video bg-black relative">
            <WebcamStream compact patientId="1" patientName="Aarav Sharma" roomCode="101" hospitalId="hosp_default" />
          </div>
        </Card>

        <Card className="overflow-hidden bg-slate-900/50 border border-slate-800">
          <CardHeader>
            <CardTitle>Room 105 - Priya Nair</CardTitle>
          </CardHeader>
          <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
            <span>📹 Feed Offline (Standby Mode)</span>
          </div>
        </Card>

        <Card className="overflow-hidden bg-slate-900/50 border border-slate-800">
          <CardHeader>
            <CardTitle>Room 108 - Rohan Verma</CardTitle>
          </CardHeader>
          <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
            <span>📹 Feed Offline (Standby Mode)</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// 10. Activity History (Activity History Logs)
export function ActivityHistory() {
  const { hospitalId } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockList = [
      { id: "act_1", patientName: "Aarav Sharma", activity: "Standing", confidence: "95%", timestamp: "2026-06-22 10:15:00 AM", hospitalId },
      { id: "act_2", patientName: "Priya Nair", activity: "Sitting", confidence: "92%", timestamp: "2026-06-22 10:14:30 AM", hospitalId },
      { id: "act_3", patientName: "Rohan Verma", activity: "Lying Down", confidence: "99%", timestamp: "2026-06-22 10:13:00 AM", hospitalId }
    ];
    setHistory(mockList);
    setLoading(false);
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "activity", label: "Logged Patient Activity", className: "font-bold text-green-400" },
    { key: "confidence", label: "Confidence Score" },
    { key: "timestamp", label: "Timestamp", className: "font-mono text-slate-400" }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
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
      />
    </div>
  );
}

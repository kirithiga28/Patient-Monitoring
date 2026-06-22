import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { activityService } from "../../services/activityService";
import { alertService } from "../../services/alertService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import { ChartCard } from "../../components/ui/ChartCard";
import WebcamStream from "../../components/WebcamStream";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

// 25. Real-Time Activity Analytics
export function RealTimeActivityAnalytics() {
  const { hospitalId } = useAuth();
  // Mock activity analytics counts
  const chartData = [
    { name: "Standing", count: 42 },
    { name: "Sitting", count: 35 },
    { name: "Walking", count: 28 },
    { name: "Lying Down", count: 18 },
    { name: "Fall Incidents", count: 2 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Real-Time Pose Analytics</h1>
        <p className="text-slate-400 text-xs mt-1">Aggregate charts of patient activities, walking rates, and bed exit occurrences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Patient Activity Distribution (Current Shift)" className="lg:col-span-2">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Frames Processed</span>
              <span className="font-bold text-white">124,850</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Avg Engine Frame Rate</span>
              <span className="font-bold text-green-400">4.2 FPS</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Detection Accuracy rate</span>
              <span className="font-bold text-cyan-400">97.8%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 26. Fall Detection Center
export function FallDetectionCenter() {
  const { hospitalId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Filter alerts to show Fall incidents
    const q = alertService.listenAlerts("doctor", hospitalId, (list) => {
      setAlerts(list.filter(a => a.alertType === "Fall Detected"));
      setLoading(false);
    });
    return () => q();
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "room", label: "Room" },
    { key: "timestamp", label: "Incident Time", render: (row) => row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : "Recent" },
    {
      key: "severity",
      label: "Severity",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">
          {row.severity}
        </span>
      )
    },
    { key: "status", label: "Alert Action Status" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span className="animate-ping">🚨</span> Fall Incident Control Center
        </h1>
        <p className="text-slate-400 text-xs mt-1">Review active fall incidents, nurse confirmations, and response coordinates.</p>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        searchKey="patientName"
        searchPlaceholder="Search fall incident..."
        loading={loading}
      />
    </div>
  );
}

// 27. Abnormal Activity Review
export function AbnormalActivityReview() {
  const { hospitalId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = alertService.listenAlerts("doctor", hospitalId, (list) => {
      setAlerts(list.filter(a => a.alertType !== "Fall Detected"));
      setLoading(false);
    });
    return () => q();
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient Name" },
    { key: "room", label: "Room" },
    { key: "alertType", label: "Abnormal Behavior Flag", className: "font-bold text-yellow-400" },
    { key: "severity", label: "Severity" },
    { key: "notes", label: "Alert Logs Details", className: "max-w-xs truncate text-[10px] text-slate-400" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Abnormal Activity Review</h1>
        <p className="text-slate-400 text-xs mt-1">Review and double-check anomalies flagged by the AI (e.g. Bed Exits, Inactivity Warnings).</p>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        searchKey="patientName"
        searchPlaceholder="Search anomalies..."
        loading={loading}
      />
    </div>
  );
}

// 28. AI Incident Investigation
export function AIIncidentInvestigation() {
  const { hospitalId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = alertService.listenAlerts("doctor", hospitalId, (list) => {
      setAlerts(list);
      setLoading(false);
    });
    return () => q();
  }, [hospitalId]);

  const columns = [
    { key: "id", label: "Incident ID Reference", className: "font-mono text-[9px] text-slate-500" },
    { key: "patientName", label: "Patient" },
    { key: "alertType", label: "Flagged Incident Event" },
    { key: "resolvedBy", label: "Investigated By", render: (row) => row.resolvedBy || "Pending Review" },
    { key: "notes", label: "Action & Resolution Steps", className: "text-slate-400 text-[10px]" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">AI Incident Audits</h1>
        <p className="text-slate-400 text-xs mt-1">Investigate incident logs, compile notes, and record resolution workflows.</p>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        searchKey="patientName"
        searchPlaceholder="Search incident logs..."
        loading={loading}
      />
    </div>
  );
}

// 29. Live Multi-Camera Monitoring Wall
export function LiveMultiCameraMonitoringWall() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Live Multi-Camera Wall</h1>
        <p className="text-slate-400 text-xs mt-1">Simultaneous multi-camera wall viewports for real-time ward telemetry.</p>
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

        <Card className="overflow-hidden bg-slate-900/50">
          <CardHeader>
            <CardTitle>Room 105 - Priya Nair</CardTitle>
          </CardHeader>
          <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
            <span>📹 Feed Offline (Standby Mode)</span>
          </div>
        </Card>

        <Card className="overflow-hidden bg-slate-900/50">
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

// 30. AI Detection History
export function AIDetectionHistory() {
  const { hospitalId } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Standard mock list for activity logs history table
    const mockList = [
      { id: "act_1", patientName: "Aarav Sharma", activity: "Standing", confidence: "95%", timestamp: "2026-06-22 10:15:00 AM", hospitalId },
      { id: "act_2", patientName: "Priya Nair", activity: "Sitting", confidence: "92%", timestamp: "2026-06-22 10:14:30 AM", hospitalId },
      { id: "act_3", patientName: "Rohan Verma", activity: "Both Hands Raised", confidence: "99%", timestamp: "2026-06-22 10:13:00 AM", hospitalId }
    ];
    setHistory(mockList);
    setLoading(false);
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "activity", label: "Detected Activity Class", className: "font-bold text-green-400" },
    { key: "confidence", label: "Confidence" },
    { key: "timestamp", label: "Detection Timestamp", className: "font-mono text-slate-400" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">AI Detection History Logs</h1>
        <p className="text-slate-400 text-xs mt-1">Review historical pose activity data, confidence logs, and telemetry stamps.</p>
      </div>

      <DataTable
        columns={columns}
        data={history}
        searchKey="patientName"
        searchPlaceholder="Search detection history..."
        loading={loading}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import { alertService } from "../services/alertService";
import { cameraService } from "../services/cameraService";
import WebcamStream from "../components/WebcamStream";
import { activityService } from "../services/activityService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function Dashboard() {
  const { hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWebcamId, setActiveWebcamId] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Real-time patients listener
    const unsubPatients = patientService.listenPatients(
      "doctor",
      hospitalId,
      null,
      null,
      (patientList) => {
        setPatients(patientList);
        setLoading(false);
      }
    );

    // Real-time alerts listener
    const unsubAlerts = alertService.listenAlerts("doctor", hospitalId, (alertList) => {
      setAlerts(alertList);
    });

    // Real-time cameras listener
    const unsubCameras = cameraService.listenCameras("doctor", hospitalId, (cameraList) => {
      setCameras(cameraList);
    });

    // Real-time activities listener
    const unsubActivities = activityService.listenActivities("doctor", hospitalId, (activitiesList) => {
      setActivities(activitiesList);
    });

    return () => {
      unsubPatients();
      unsubAlerts();
      unsubCameras();
      unsubActivities();
    };
  }, [hospitalId]);

  // Auto-start the first configured camera stream if present
  useEffect(() => {
    if (cameras.length > 0 && !activeWebcamId) {
      setActiveWebcamId(cameras[0].id);
    }
  }, [cameras, activeWebcamId]);

  // Real-time audio alarms for new open alerts
  useEffect(() => {
    const activeOpenAlerts = alerts.filter(a => a.status === "Open");
    if (activeOpenAlerts.length > 0) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // high tone
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
      } catch (e) {
        console.warn("Could not play synthesized audio alarm:", e);
      }

      try {
        const latestAlert = activeOpenAlerts[0];
        const speech = new SpeechSynthesisUtterance(
          `Attention! ${latestAlert.alertType} detected in Room ${latestAlert.room}.`
        );
        speech.rate = 0.95;
        window.speechSynthesis.speak(speech);
      } catch (e) {
        console.warn("Could not speak alert announcement:", e);
      }
    }
  }, [alerts]);

  const totalPatients = patients.length;
  const criticalPatients = patients.filter((p) => p.status === "Critical").length;
  const observationPatients = patients.filter((p) => p.status === "Observation").length;
  const stablePatients = patients.filter((p) => p.status === "Stable").length;
  const icuPatients = patients.filter((p) => p.status === "Critical" || p.room === "101" || p.room === "105" || p.room === "110").length;

  const openAlertsCount = alerts.filter((a) => a.status === "Open").length;
  const activeCamerasCount = cameras.filter(c => c.status === "Active" || c.status === "Streaming").length;

  const chartData = [
    { name: "Stable", count: stablePatients, color: "#10b981" },
    { name: "Observation", count: observationPatients, color: "#eab308" },
    { name: "Critical", count: criticalPatients, color: "#ef4444" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <p className="text-blue-500 font-semibold tracking-wider text-xs uppercase">
            Well Care Hospital Monitoring System
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Clinical Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Current Session: {userData?.name || "Dr. Rajesh Mehta"} • {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold ${
          openAlertsCount > 0 
            ? "bg-red-950/40 border-red-500/50 text-red-400 animate-pulse" 
            : "bg-slate-950/40 border-slate-800 text-slate-400"
        }`}>
          <span>🚨</span>
          <span>{openAlertsCount} Active Emergency Alerts</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-blue-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Total Patients</p>
          <p className="text-3xl font-extrabold text-blue-500 mt-2">{totalPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-red-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Critical Status</p>
          <p className="text-3xl font-extrabold text-red-500 mt-2">{criticalPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-yellow-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Observation</p>
          <p className="text-3xl font-extrabold text-yellow-500 mt-2">{observationPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-indigo-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">ICU Status</p>
          <p className="text-3xl font-extrabold text-indigo-500 mt-2">{icuPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-green-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Active Cameras</p>
          <p className="text-3xl font-extrabold text-green-500 mt-2">{activeCamerasCount}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-red-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Emergency Alerts</p>
          <p className="text-3xl font-extrabold text-red-600 mt-2">{alerts.length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Real-time Camera Feeds Grid */}
        <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📹</span> Active Camera Feed
            </h2>
            <span className="text-xs text-slate-400 font-medium">Mapped Devices: {cameras.length}</span>
          </div>

          {cameras.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500">
              <span className="text-4xl mb-2">📹</span>
              <p className="text-sm font-medium">No Camera Feeds Configured</p>
              <p className="text-xs text-slate-600">Assign cameras in the Camera Manager.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {cameras.slice(0, 2).map((camera) => (
                <div key={camera.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl shadow space-y-3">
                  <div className="relative aspect-video bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 w-full">
                    {activeWebcamId === camera.id ? (
                      <WebcamStream
                        patientId={camera.patientId}
                        patientName={patients.find(p => p.id === camera.patientId)?.name || "Unknown Patient"}
                        roomCode={camera.room || "101"}
                        hospitalId={hospitalId}
                        compact={true}
                      />
                    ) : (
                      <>
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-[10px] font-black text-white rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                        </span>
                        <button
                          onClick={() => setActiveWebcamId(camera.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          📺 Start Feed
                        </button>
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 text-xs">{camera.name}</h3>
                    <p className="text-[10px] text-slate-400">Room: {camera.room || "N/A"}</p>
                    <p className="text-[10px] text-slate-400">Assignee: {patients.find(p => p.id === camera.patientId)?.name || "Unassigned"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Analytics & Event Log */}
        <div className="space-y-6">
          {/* Status Chart */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
              <span>📊</span> Patient Health Status
            </h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "rgba(30, 41, 59, 0.5)" }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activities Log */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
              <span>📋</span> Recent Activities
            </h2>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-200">{activity.patientName}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{activity.activity}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  </span>
                </div>
              ))}

              {activities.length === 0 && (
                <p className="text-center text-slate-500 text-xs py-4">No recent activities logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-slate-500 text-xs pt-8 border-t border-slate-900">
        Well Care Hospital Monitoring System • Real-Time Ward & Patient Telemetry Portal
      </div>
    </div>
  );
}

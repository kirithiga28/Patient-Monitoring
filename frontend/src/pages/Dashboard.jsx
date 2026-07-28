import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import { cameraService } from "../services/cameraService";
import WebcamStream from "../components/WebcamStream";
import { activityService } from "../services/activityService";
import { alertService } from "../services/alertService";
import { notificationService } from "../services/notificationService";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Dashboard() {
  const { hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWebcamId, setActiveWebcamId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Real-time patients listener (ISOLATED TO LOGGED IN DOCTOR)
    const unsubPatients = patientService.listenPatients(
      "doctor",
      hospitalId,
      userData,
      null,
      (patientList) => {
        setPatients(patientList);
        setLoading(false);
      }
    );

    // Real-time cameras listener
    const unsubCameras = cameraService.listenCameras("doctor", hospitalId, (cameraList) => {
      setCameras(cameraList);
    });

    // Real-time activities listener
    const unsubActivities = activityService.listenActivities("doctor", hospitalId, (activitiesList) => {
      setActivities(activitiesList);
    });

    // Real-time alerts listener
    const unsubAlerts = alertService.listenAlerts("doctor", hospitalId, (alertList) => {
      const docId = userData?.uid || userData?.id;
      const active = alertList.filter(a => (!docId || a.doctorId === docId) && (a.status === "Triggered" || a.status === "Active"));
      setAlertsCount(active.length);
    });

    // Real-time notifications listener
    const unsubNotifications = notificationService.listenNotifications(hospitalId, (notifList) => {
      const docId = userData?.uid || userData?.id;
      const filtered = notifList.filter(n => !docId || n.doctorId === docId || (userData?.name && n.message && n.message.includes(userData.name)));
      setNotificationsCount(filtered.length);
    });

    // Real-time medical records listener for reports count
    const qRecords = query(
      collection(db, "medical_records"),
      where("hospitalId", "==", hospitalId || "WHC-2026-1001")
    );
    const unsubRecords = onSnapshot(qRecords, (snap) => {
      setReportsCount(snap.docs.length);
    }, (err) => console.warn("Dashboard records count listener warning:", err.message));

    return () => {
      clearTimeout(timer);
      unsubPatients();
      unsubCameras();
      unsubActivities();
      unsubAlerts();
      unsubNotifications();
      unsubRecords();
    };
  }, [hospitalId, userData]);

  // Auto-start the first configured camera stream if present
  useEffect(() => {
    if (cameras.length > 0 && !activeWebcamId) {
      setActiveWebcamId(cameras[0].id);
    }
  }, [cameras, activeWebcamId]);


  const totalPatients = patients.length;
  const criticalPatients = patients.filter((p) => p.status === "Critical").length;
  const observationPatients = patients.filter((p) => p.status === "Observation").length;
  const icuPatients = patients.filter((p) => p.status === "Critical" || p.room === "101" || p.room === "105" || p.room === "110").length;

  const activeCamerasCount = cameras.filter(c => c.status === "Active" || c.status === "Streaming").length;

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
            Current Session: {userData?.name || "Doctor"} • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-blue-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Total Patients</p>
          <p className="text-2xl font-extrabold text-blue-500 mt-2">{totalPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-red-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Critical Patients</p>
          <p className="text-2xl font-extrabold text-red-500 mt-2">{criticalPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-indigo-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">ICU Patients</p>
          <p className="text-2xl font-extrabold text-indigo-500 mt-2">{icuPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-yellow-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Observation</p>
          <p className="text-2xl font-extrabold text-yellow-500 mt-2">{observationPatients}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-orange-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Active Alerts</p>
          <p className="text-2xl font-extrabold text-orange-500 mt-2">{alertsCount}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-green-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Reports</p>
          <p className="text-2xl font-extrabold text-green-500 mt-2">{reportsCount}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg hover:border-purple-500/50 transition">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Notifications</p>
          <p className="text-2xl font-extrabold text-purple-500 mt-2">{notificationsCount}</p>
        </div>
      </div>

      {/* Camera Feed + Recent Activities */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Active Camera Feed */}
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

        {/* Recent Activities — expanded in its column */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4 flex flex-col">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
            <span>📋</span> Recent Activities
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[420px]">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-200">{activity.patientName}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{activity.activity}</p>
                </div>
                <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-2">
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                </span>
              </div>
            ))}

            {activities.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-4">No recent activities logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-slate-500 text-xs pt-8 border-t border-slate-900">
        Well Care Hospital Monitoring System • Real-Time Ward &amp; Patient Telemetry Portal
      </div>
    </div>
  );
}

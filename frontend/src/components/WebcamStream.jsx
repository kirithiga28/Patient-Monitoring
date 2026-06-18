import { useEffect, useRef, useState } from "react";
import { alertService } from "../services/alertService";
import { activityService } from "../services/activityService";
import { API_BASE_URL } from "../config/api";

export default function WebcamStream({ patientId, patientName, roomCode, hospitalId, compact = false }) {
  const videoRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const lastAlertSentRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [activity, setActivity] = useState("Initializing...");
  const [confidence, setConfidence] = useState("--");
  const [alertStatus, setAlertStatus] = useState("Normal");
  const [isFallAlert, setIsFallAlert] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [annotatedFrame, setAnnotatedFrame] = useState(null);

  // Camera state
  const [cameraRunning, setCameraRunning] = useState(true);

  // Advanced telemetry states
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [aiStatus, setAiStatus] = useState("AI Backend Offline");
  const [connectionHealth, setConnectionHealth] = useState("Disconnected");
  const [lastDetectionTime, setLastDetectionTime] = useState("--");
  const [history, setHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const playSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 1.0);
      
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      setTimeout(() => osc.stop(), 1000);
    } catch (e) {
      console.warn("Could not play alarm siren:", e);
    }
  };

  // Start webcam hardware
  const startCamera = async () => {
    try {
      setStreamError("");
      setConnectionHealth("Connecting...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setConnectionHealth("Connected");
      setCameraRunning(true);
      setActivity("Standing");
    } catch (err) {
      console.error("Webcam hardware access error:", err);
      setStreamError("Unable to access camera hardware. Verify permissions.");
      setConnectionHealth("Hardware Error");
      setCameraRunning(false);
    }
  };

  // Stop webcam hardware
  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setAnnotatedFrame(null);
    setCameraRunning(false);
    setConnectionHealth("Disconnected");
    setActivity("Camera Stopped");
    setConfidence("--");
    setAlertStatus("Normal");
    setIsFallAlert(false);
  };

  // Start camera on mount
  useEffect(() => {
    if (cameraRunning) {
      startCamera();
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Listen to Firestore history for patient
  useEffect(() => {
    if (!patientId || patientId === "unassigned") return;
    
    const unsubActivities = activityService.listenActivitiesForPatient(patientId, (activityList) => {
      setHistory(activityList.slice(0, 10));
    });

    const unsubAlerts = alertService.listenAlertsForPatient(patientId, (alertList) => {
      setTimeline(alertList.slice(0, 10));
    });

    return () => {
      unsubActivities();
      unsubAlerts();
    };
  }, [patientId]);

  // Frame analyze loop
  useEffect(() => {
    let intervalId;
    if (localStream && cameraRunning) {
      intervalId = setInterval(async () => {
        if (!videoRef.current) return;
        const startTime = Date.now();
        try {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const frameBase64 = canvas.toDataURL("image/jpeg");
          const payload = {
            frame_base64: frameBase64,
            patient_id: patientId || "unassigned",
            patient_name: patientName || "Unknown Patient",
            room_code: roomCode || "N/A",
            hospital_id: hospitalId || "hosp_default"
          };

          const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            const endTime = Date.now();
            
            // Calculate FPS & Latency
            setLatency(endTime - startTime);
            const now = Date.now();
            if (lastFrameTimeRef.current) {
              const fpsVal = (1000 / (now - lastFrameTimeRef.current)).toFixed(1);
              setFps(fpsVal);
            }
            lastFrameTimeRef.current = now;

            // Set state updates
            setActivity(data.activity || "Unknown");
            setConfidence(data.confidence || "--");
            setAiStatus("AI Backend Connected");
            setConnectionHealth("AI Backend Connected");
            setLastDetectionTime(new Date().toLocaleTimeString());

            if (data.annotated_frame_base64) {
              setAnnotatedFrame(data.annotated_frame_base64);
            }
            
            // Handle automatic alerts checking
            const isAlertActivity = data.activity === "Fall Detected" || data.activity === "Inactivity Warning";
            if (isAlertActivity || data.alert_created) {
              setAlertStatus("CRITICAL");
              playSiren();
              setIsFallAlert(true);

              // Save to Firestore if it's a new alert type occurrence
              if (lastAlertSentRef.current !== data.activity) {
                lastAlertSentRef.current = data.activity;
                alertService.createAlert({
                  patientId: patientId || "unassigned",
                  patientName: patientName || "Unknown Patient",
                  room: roomCode || "N/A",
                  alertType: data.activity,
                  severity: data.activity === "Fall Detected" ? "Critical" : "High",
                  hospitalId: hospitalId || "hosp_default"
                }).catch(err => console.error("Error creating alert in Firestore:", err));
              }
            } else {
              setAlertStatus("Normal");
              setIsFallAlert(false);
              lastAlertSentRef.current = null;
            }
          } else {
            setAiStatus("AI Backend Offline");
            setConnectionHealth("AI Backend Offline");
            setFps(0);
            setIsFallAlert(false);
          }
        } catch (err) {
          console.warn("AI service analyze call failed:", err);
          setAiStatus("AI Backend Offline");
          setConnectionHealth("AI Backend Offline");
          setFps(0);
          setIsFallAlert(false);
        }
      }, 2000); // 2 seconds interval
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [localStream, cameraRunning, patientId, patientName, roomCode, hospitalId]);

  if (compact) {
    return (
      <div className="w-full h-full relative flex flex-col justify-between bg-slate-950 rounded-lg overflow-hidden">
        {isFallAlert && (
          <div className="absolute top-2 left-2 right-2 bg-red-600/90 text-white font-bold text-[9px] py-1 px-2 rounded z-20 animate-pulse border border-red-500 flex items-center justify-between">
            <span>🚨 EMERGENCY ALARM ACTIVE IN ROOM {roomCode}!</span>
          </div>
        )}
        {aiStatus === "AI Backend Offline" && (
          <div className="absolute top-2 left-2 right-2 bg-amber-600/90 text-white font-bold text-[9px] py-1 px-2 rounded z-20 border border-amber-500 flex items-center justify-between">
            <span>⚠️ AI Backend Offline</span>
          </div>
        )}
        
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {streamError ? (
            <div className="text-center text-slate-500 text-[10px] p-2">
              <span>⚠️ Camera Hardware Lock</span>
            </div>
          ) : (
            <>
              {annotatedFrame && cameraRunning ? (
                <img
                  src={annotatedFrame}
                  alt="Skeleton Overlay Stream"
                  className="w-full h-full object-cover"
                />
              ) : null}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: annotatedFrame && cameraRunning ? "none" : "block" }}
              />
              {!cameraRunning && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-[10px] text-slate-500 gap-1">
                  <span>📹 Feed Offline</span>
                </div>
              )}
            </>
          )}

          {/* Compact stats overlay inside frame */}
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur border border-slate-800 p-2 rounded-lg text-[9px] text-white z-10 flex items-center justify-between gap-1">
            <div>
              <span className="text-[7px] text-slate-400 font-bold uppercase block">Activity</span>
              <span className={`font-extrabold text-[10px] ${isFallAlert ? "text-red-400" : "text-green-400"}`}>
                {activity}
              </span>
            </div>
            <div>
              <span className="text-[7px] text-slate-400 font-bold uppercase block">Confidence</span>
              <span className="font-extrabold text-[10px] text-slate-100">{confidence}</span>
            </div>
            <div className="text-right">
              <span className="text-[7px] text-slate-400 font-bold uppercase block">Alert</span>
              <span className={`font-extrabold text-[10px] uppercase ${isFallAlert ? "text-red-400 animate-pulse" : "text-slate-300"}`}>
                {alertStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Fall Alert Red Flashing Banner */}
      {isFallAlert && (
        <div className="bg-red-600 text-white font-black text-xs py-3 px-4 rounded-xl flex items-center justify-between animate-pulse shadow-lg shadow-red-600/40 border border-red-500 relative z-20">
          <span className="flex items-center gap-2">
            <span className="text-base animate-bounce">🚨</span> EMERGENCY ALARM ACTIVE IN ROOM {roomCode}!
          </span>
          <span className="bg-white text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">
            Critical
          </span>
        </div>
      )}

      {/* Warning Banner for offline FastAPI server */}
      {aiStatus === "AI Backend Offline" && (
        <div className="bg-amber-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-between shadow-lg border border-amber-500 relative z-20">
          <span className="flex items-center gap-2">
            <span>⚠️</span> AI Backend Offline. Fallback and alerts are running locally.
          </span>
          <button
            onClick={startCamera}
            className="bg-white hover:bg-slate-100 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer"
          >
            🔌 Reconnect Server
          </button>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Camera Feed Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            {/* Header Telemetry stats bar */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Device status:</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className={`w-2 h-2 rounded-full ${
                    connectionHealth.includes("Connected") || connectionHealth === "Healthy" || connectionHealth === "Connected" ? "bg-green-500 animate-ping" : "bg-red-500"
                  }`} />
                  <span className={connectionHealth.includes("Connected") || connectionHealth === "Healthy" || connectionHealth === "Connected" ? "text-green-400" : "text-red-400"}>
                    {connectionHealth}
                  </span>
                </span>
              </div>

              {/* Start / Stop Camera Controls */}
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  disabled={cameraRunning}
                  className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-[10px] font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  Start Camera
                </button>
                <button
                  onClick={stopCamera}
                  disabled={!cameraRunning}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  Stop Camera
                </button>
              </div>

              <div className="flex items-center gap-4 text-slate-400">
                <div>
                  <span className="font-bold">Latency:</span>{" "}
                  <span className="font-semibold text-slate-200">{latency} ms</span>
                </div>
                <div>
                  <span className="font-bold">Rate:</span>{" "}
                  <span className="font-semibold text-slate-200">{fps} FPS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">Engine:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    aiStatus.includes("Connected")
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {aiStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Video Canvas Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {streamError ? (
                <div className="text-center text-slate-500 text-xs p-4">
                  <span className="text-3xl block mb-2">⚠️</span>
                  <p className="font-bold">{streamError}</p>
                </div>
              ) : (
                <>
                  {annotatedFrame && cameraRunning ? (
                    <img
                      src={annotatedFrame}
                      alt="Skeleton Overlay Stream"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ display: annotatedFrame && cameraRunning ? "none" : "block" }}
                  />
                  {!cameraRunning && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                      <span className="text-3xl">📹</span>
                      <p className="font-bold">Camera Feed is Offline</p>
                      <p className="text-[10px]">Click 'Start Camera' above to mount hardware.</p>
                    </div>
                  )}
                </>
              )}

              {/* Bottom stats overlay inside stream frame */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur border border-slate-800 p-4 rounded-xl text-xs text-white z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Activity</span>
                  <span className={`font-extrabold text-sm ${isFallAlert ? "text-red-400 animate-pulse" : "text-green-400"}`}>
                    {activity}
                  </span>
                </div>

                <div className="text-center md:text-left">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Confidence</span>
                  <span className="font-extrabold text-sm text-slate-100">{confidence}</span>
                </div>

                <div className="text-left md:text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Alert Status</span>
                  <span className={`font-extrabold text-sm uppercase ${isFallAlert ? "text-red-400 animate-pulse" : "text-slate-300"}`}>
                    {alertStatus}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Timestamp</span>
                  <span className="font-extrabold text-xs text-slate-300">
                    {lastDetectionTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History & Event Timeline Cards */}
        <div className="space-y-6">
          
          {/* Patient Activity history timeline list */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col h-[280px]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span>📊</span> Patient Activity Log
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {history.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl flex justify-between items-center text-[11px] hover:border-slate-800 transition"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">{log.activity}</span>
                    <span className="text-[10px] text-slate-500">
                      {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : "Recent"}
                    </span>
                  </div>
                  <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
                    {log.confidence}
                  </span>
                </div>
              ))}

              {history.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-12">No activities logged yet.</p>
              )}
            </div>
          </div>

          {/* Incident alerts timeline logs list */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col h-[280px]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span>🚨</span> Event Warning Timeline
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {timeline.map((alertItem) => (
                <div 
                  key={alertItem.id} 
                  className={`border p-2.5 rounded-xl flex justify-between items-start text-[11px] hover:opacity-90 transition ${
                    alertItem.severity === "Critical" 
                      ? "bg-red-500/10 border-red-500/20 text-red-400" 
                      : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold block">{alertItem.alertType}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {alertItem.timestamp ? new Date(alertItem.timestamp).toLocaleTimeString() : "Just now"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Status: {alertItem.status}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${
                    alertItem.severity === "Critical" ? "bg-red-600" : "bg-orange-600"
                  }`}>
                    {alertItem.severity}
                  </span>
                </div>
              ))}

              {timeline.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-12">No incident reports recorded.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

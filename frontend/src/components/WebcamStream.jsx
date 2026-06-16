import { useEffect, useRef, useState } from "react";
import { alertService } from "../services/alertService";

export default function WebcamStream({ patientId, patientName, roomCode, hospitalId }) {
  const videoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [activity, setActivity] = useState("Initializing...");
  const [confidence, setConfidence] = useState("--");
  const [alertStatus, setAlertStatus] = useState("Normal");
  const [isFallAlert, setIsFallAlert] = useState(false);
  const [streamError, setStreamError] = useState("");

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

  useEffect(() => {
    async function startStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam hardware access error:", err);
        setStreamError("Unable to access camera hardware. Verify permissions.");
      }
    }
    startStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;
    if (localStream) {
      intervalId = setInterval(async () => {
        if (!videoRef.current) return;
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

          const response = await fetch("http://localhost:8000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            setActivity(data.activity || "Unknown");
            setConfidence(data.confidence || "--");
            
            if (data.activity === "Fall Detected") {
              setAlertStatus("CRITICAL");
              setIsFallAlert(true);
              playSiren();
              
              // Frontend creates firestore alert as well to guarantee insertion
              await alertService.createAlert({
                patientId: patientId || "unassigned",
                patientName: patientName || "Unknown Patient",
                room: roomCode || "N/A",
                alertType: "Fall Detected",
                severity: "Critical",
                hospitalId: hospitalId || "hosp_default"
              });
            } else {
              setAlertStatus("Normal");
              setIsFallAlert(false);
            }
          }
        } catch (err) {
          console.warn("AI service analyze call failed:", err);
          setActivity("Offline (FastAPI server connecting...)");
        }
      }, 2000); // 2 seconds interval
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [localStream, patientId, patientName, roomCode, hospitalId]);

  return (
    <div className="w-full relative space-y-4">
      {/* Alert Banner */}
      {isFallAlert && (
        <div className="bg-red-600 text-white font-black text-xs py-3 px-4 rounded-xl flex items-center justify-between animate-bounce shadow-lg shadow-red-600/40 border border-red-500 relative z-20">
          <span className="flex items-center gap-2">
            <span>🚨</span> WARNING: FALL DETECTED IN ROOM {roomCode}!
          </span>
          <span className="bg-white text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">
            Critical
          </span>
        </div>
      )}

      {/* Video Stream viewport */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {streamError ? (
          <div className="text-center text-slate-500 text-xs p-4">
            <span className="text-3xl block mb-2">⚠️</span>
            <p className="font-bold">{streamError}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay Stats Indicators */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur border border-slate-855 p-4 rounded-xl flex items-center justify-between text-xs text-white z-10">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Observed Activity</span>
            <span className={`font-extrabold text-sm ${isFallAlert ? "text-red-400" : "text-green-400"}`}>
              {activity}
            </span>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Confidence</span>
            <span className="font-extrabold text-sm text-slate-100">{confidence}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Alert Status</span>
            <span className={`font-extrabold text-sm uppercase ${isFallAlert ? "text-red-400 animate-pulse" : "text-slate-300"}`}>
              {alertStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

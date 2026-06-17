import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function PoseTestingSuite() {
  const { hospitalId } = useAuth();
  const videoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [activity, setActivity] = useState("Standing");
  const [confidence, setConfidence] = useState("--");
  const [landmarksCount, setLandmarksCount] = useState(0);
  const [aiStatus, setAiStatus] = useState("Offline");
  const [latency, setLatency] = useState(0);
  const [fps, setFps] = useState(0);
  const [annotatedFrame, setAnnotatedFrame] = useState(null);
  const [streamError, setStreamError] = useState("");
  const lastFrameTimeRef = useRef(null);

  // Debug Mode states
  const [isDebug, setIsDebug] = useState(false);
  const [rawLandmarks, setRawLandmarks] = useState([]);

  // Posture Verification Checklist Matrix
  const [verifiedPoses, setVerifiedPoses] = useState({
    Standing: false,
    Sitting: false,
    "Hands Raised": false,
    "Hands Down": false,
    "Lying Down": false,
    "Fall Detected": false
  });

  // Access user camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setStreamError("Webcam hardware is locked or permission denied.");
      }
    }
    startCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Frame analyze loop at 1-second interval
  useEffect(() => {
    let intervalId;
    if (localStream) {
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
            patient_id: "test_suite_patient",
            patient_name: "Verification Suite",
            room_code: "TEST_LAB",
            hospital_id: hospitalId || "hosp_default"
          };

          const response = await fetch("http://localhost:8000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            const endTime = Date.now();
            setLatency(endTime - startTime);
            
            const now = Date.now();
            if (lastFrameTimeRef.current) {
              const fpsVal = (1000 / (now - lastFrameTimeRef.current)).toFixed(1);
              setFps(fpsVal);
            }
            lastFrameTimeRef.current = now;

            setActivity(data.activity || "Unknown");
            setConfidence(data.confidence || "--");
            setLandmarksCount(data.landmarks_count || 0);
            setAiStatus(data.ai_status || "MediaPipe Active");
            setRawLandmarks(data.raw_landmarks || []);

            if (data.annotated_frame_base64) {
              setAnnotatedFrame(data.annotated_frame_base64);
            }

            // Mark posture as verified in state checklist matrix
            if (data.activity in verifiedPoses) {
              setVerifiedPoses(prev => ({
                ...prev,
                [data.activity]: true
              }));
            }
          } else {
            setAiStatus("Offline");
            setFps(0);
          }
        } catch (err) {
          console.warn("AI service call failed in test suite:", err);
          setAiStatus("Offline");
          setFps(0);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [localStream, hospitalId, verifiedPoses]);

  const resetVerification = () => {
    setVerifiedPoses({
      Standing: false,
      Sitting: false,
      "Hands Raised": false,
      "Hands Down": false,
      "Lying Down": false,
      "Fall Detected": false
    });
  };

  const poseGuidelines = {
    Standing: "Stand upright inside the frame with your feet close together.",
    Sitting: "Sit in a chair, keeping your hips and knees aligned horizontally.",
    "Hands Raised": "Raise one or both hands/wrists above the level of your shoulders.",
    "Hands Down": "Keep both hands hanging straight down below your hip line.",
    "Lying Down": "Lay down horizontally (or lean very far sideways) higher in the frame.",
    "Fall Detected": "Transition swiftly to a horizontal posture in the lower half of the frame."
  };

  // Human-readable labels for MediaPipe pose landmarks
  const landmarkLabels = [
    "Nose", "Left Eye Inner", "Left Eye", "Left Eye Outer", "Right Eye Inner", "Right Eye", "Right Eye Outer",
    "Left Ear", "Right Ear", "Mouth Left", "Mouth Right", "Left Shoulder", "Right Shoulder", "Left Elbow", "Right Elbow",
    "Left Wrist", "Right Wrist", "Left Pinky", "Right Pinky", "Left Index", "Right Index", "Left Thumb", "Right Thumb",
    "Left Hip", "Right Hip", "Left Knee", "Right Knee", "Left Ankle", "Right Ankle", "Left Heel", "Right Heel",
    "Left Foot Index", "Right Foot Index"
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AI Pose Verification Suite
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Clinical calibration console to test real-time MediaPipe pose classifications.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setIsDebug(!isDebug)}
            className={`px-4 py-2.5 font-bold border rounded-xl text-xs transition cursor-pointer ${
              isDebug 
                ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20" 
                : "bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-400"
            }`}
          >
            {isDebug ? "⚙️ Close Debug Panel" : "⚙️ Open Debug Panel"}
          </button>
          
          <button
            onClick={resetVerification}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold border border-slate-700 rounded-xl text-xs transition cursor-pointer"
          >
            🔄 Reset Verification Checklist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left webcam container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            {/* Telemetry bar */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold">Engine Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  aiStatus === "MediaPipe Active" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {aiStatus}
                </span>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="font-bold">Landmarks Extracted:</span>{" "}
                  <span className="font-bold text-slate-200">{landmarksCount} / 33</span>
                </div>
                <div>
                  <span className="font-bold">Rate:</span>{" "}
                  <span className="font-semibold text-slate-200">{fps} FPS</span>
                </div>
                <div>
                  <span className="font-bold">Latency:</span>{" "}
                  <span className="font-semibold text-slate-200">{latency} ms</span>
                </div>
              </div>
            </div>

            {/* Video preview */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {streamError ? (
                <div className="text-center text-slate-500 text-xs p-4">
                  <span className="text-3xl block mb-2">⚠️</span>
                  <p className="font-bold">{streamError}</p>
                </div>
              ) : (
                <>
                  {annotatedFrame ? (
                    <img
                      src={annotatedFrame}
                      alt="Testing Skeleton Stream"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ display: annotatedFrame ? "none" : "block" }}
                  />
                </>
              )}

              {/* Bottom stats inside stream */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs text-white z-10">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Classification</span>
                  <span className="font-extrabold text-sm text-green-400">{activity}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Confidence Score</span>
                  <span className="font-extrabold text-sm text-slate-100">{confidence}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right validation matrix */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📋</span> Posture Verification Matrix
            </h3>
            
            <div className="space-y-4">
              {Object.keys(verifiedPoses).map(pose => (
                <div 
                  key={pose}
                  className={`border p-4 rounded-xl flex items-start gap-3 transition ${
                    verifiedPoses[pose] 
                      ? "bg-green-500/10 border-green-500/25 text-green-400" 
                      : "bg-slate-950/60 border-slate-850 text-slate-400"
                  }`}
                >
                  <div className="pt-0.5">
                    {verifiedPoses[pose] ? (
                      <span className="text-base text-green-400">✅</span>
                    ) : (
                      <span className="text-base text-slate-600">⏳</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-xs font-black uppercase ${verifiedPoses[pose] ? "text-green-300" : "text-slate-300"}`}>
                      {pose}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {poseGuidelines[pose]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              All 6 postures must be checked to complete calibration.
            </span>
          </div>
        </div>
      </div>

      {/* Developer Debug Panel */}
      {isDebug && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-purple-400">🛠️ Developer Telemetry Console</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time raw MediaPipe coordinate arrays from backend.</p>
            </div>
            
            <div className="flex gap-6 text-xs bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl">
              <div>
                <span className="text-slate-500">Pose Count:</span>{" "}
                <span className="font-extrabold text-white">{landmarksCount}</span>
              </div>
              <div>
                <span className="text-slate-500">Pose Class:</span>{" "}
                <span className="font-extrabold text-green-400">{activity}</span>
              </div>
              <div>
                <span className="text-slate-500">Conf Score:</span>{" "}
                <span className="font-extrabold text-slate-200">{confidence}</span>
              </div>
            </div>
          </div>

          {/* Raw Coordinates Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">Raw Landmark Coordinates (X, Y, Z, Visibility)</span>
            
            <div className="max-h-[350px] overflow-y-auto border border-slate-850 rounded-xl custom-scrollbar bg-slate-950">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-semibold sticky top-0">
                    <th className="p-3">Index</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">X (horizontal)</th>
                    <th className="p-3">Y (vertical)</th>
                    <th className="p-3">Z (depth)</th>
                    <th className="p-3">Visibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50 text-slate-300">
                  {rawLandmarks.map((lm, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-slate-500">#{idx}</td>
                      <td className="p-3 font-bold text-slate-200">{landmarkLabels[idx] || `Landmark ${idx}`}</td>
                      <td className="p-3 font-mono">{lm.x?.toFixed(4)}</td>
                      <td className="p-3 font-mono">{lm.y?.toFixed(4)}</td>
                      <td className="p-3 font-mono">{lm.z?.toFixed(4)}</td>
                      <td className={`p-3 font-mono ${lm.visibility > 0.5 ? "text-green-400" : "text-yellow-500"}`}>
                        {(lm.visibility * 100)?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {rawLandmarks.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-500 text-xs font-semibold">
                        No active pose landmarks. Make sure the webcam has visual line of sight.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

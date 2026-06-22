import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

export default function PoseTestingSuite() {
  const { hospitalId } = useAuth();
  const videoRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  const [localStream, setLocalStream] = useState(null);
  const [activity, setActivity] = useState("Standing");
  const [confidence, setConfidence] = useState("--");
  const [landmarksCount, setLandmarksCount] = useState(0);
  const [engineStatus, setEngineStatus] = useState("🔴 OFFLINE");
  const [latency, setLatency] = useState(0);
  const [fps, setFps] = useState(0);
  const [annotatedFrame, setAnnotatedFrame] = useState(null);
  const [streamError, setStreamError] = useState("");
  const lastFrameTimeRef = useRef(null);

  // Debug Panel states
  const [isDebug, setIsDebug] = useState(false);
  const [rawLandmarks, setRawLandmarks] = useState([]);
  const [apiError, setApiError] = useState("");
  const [lastApiResponse, setLastApiResponse] = useState(null);

  // Test Mode states
  const [isTestMode, setIsTestMode] = useState(false);
  const [mockActivity, setMockActivity] = useState("Standing");

  // Posture Verification Checklist Matrix
  const [verifiedPoses, setVerifiedPoses] = useState({
    Standing: false,
    Sitting: false,
    "Hands Raised": false,
    "Hands Down": false,
    "Lying Down": false,
    "Fall Detected": false
  });

  // Posture mapper function: maps backend activities to canonical matrix checklist keys
  const mapActivity = (rawActivity) => {
    if (!rawActivity) return "Standing";
    const normalized = rawActivity.trim();
    if (normalized === "Standing" || normalized === "Walking") {
      return "Standing";
    }
    if (normalized === "Sitting") {
      return "Sitting";
    }
    if (
      normalized === "Both Hands Raised" ||
      normalized === "Left Hand Raised" ||
      normalized === "Right Hand Raised" ||
      normalized === "Hands Up" ||
      normalized === "Hands Raised"
    ) {
      return "Hands Raised";
    }
    if (normalized === "Hands Down") {
      return "Hands Down";
    }
    if (normalized === "Lying Down" || normalized === "Sleeping" || normalized === "Inactivity Warning") {
      return "Lying Down";
    }
    if (normalized === "Fall Detected" || normalized === "Fall Simulation") {
      return "Fall Detected";
    }
    return normalized;
  };

  const mappedActivity = mapActivity(activity);

  // 1. Connectivity Check on page load
  useEffect(() => {
    async function checkConnectivity() {
      try {
        console.log("Checking backend connectivity...");
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === "Active") {
            console.log("Backend connectivity check succeeded.");
            setEngineStatus("🟢 ONLINE");
            setApiError("");
          } else {
            console.error("Backend connectivity check failed: status response is not Active", data);
            setEngineStatus("🔴 OFFLINE");
            setApiError(`Unexpected status response: ${JSON.stringify(data)}`);
          }
        } else {
          console.error("Backend connectivity check returned non-200 status:", response.status);
          setEngineStatus("🔴 OFFLINE");
          setApiError(`HTTP status code ${response.status} from health endpoint`);
        }
      } catch (err) {
        console.error("Backend connectivity check failed:", err);
        setEngineStatus("🔴 OFFLINE");
        setApiError(err.message || "Failed to reach AI Backend health endpoint");
      }
    }
    
    if (!isTestMode) {
      checkConnectivity();
    } else {
      setEngineStatus("🟢 ONLINE");
      setApiError("");
    }
  }, [isTestMode]);

  // Access user camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        console.log("Camera initialized");
      } catch (err) {
        console.warn("Camera access failed. Fallback to AI simulation test mode activated:", err);
        setIsTestMode(true);
        setStreamError("");
      }
    }
    startCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Frame capture and analysis loop (3-5 FPS target, running at 250ms)
  useEffect(() => {
    let timeoutId;
    let active = true;

    // Helper to generate mock raw MediaPipe landmarks for Test Mode
    const generateMockLandmarks = () => {
      return Array.from({ length: 33 }, () => ({
        x: 0.5 + (Math.random() - 0.5) * 0.15,
        y: 0.5 + (Math.random() - 0.5) * 0.15,
        z: (Math.random() - 0.5) * 0.05,
        visibility: 0.85 + Math.random() * 0.15
      }));
    };

    // Helper to draw a mock neon stick figure overlay on canvas
    const drawMockSkeleton = (ctx, width, height, pose) => {
      ctx.strokeStyle = "#a855f7"; // purple neon
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Define default joint points as percentages of viewport
      let nose, lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle;

      if (pose === "Standing") {
        nose = { x: 0.5, y: 0.2 };
        lShoulder = { x: 0.45, y: 0.35 }; rShoulder = { x: 0.55, y: 0.35 };
        lElbow = { x: 0.4, y: 0.5 }; rElbow = { x: 0.6, y: 0.5 };
        lWrist = { x: 0.4, y: 0.65 }; rWrist = { x: 0.6, y: 0.65 };
        lHip = { x: 0.46, y: 0.6 }; rHip = { x: 0.54, y: 0.6 };
        lKnee = { x: 0.46, y: 0.75 }; rKnee = { x: 0.54, y: 0.75 };
        lAnkle = { x: 0.46, y: 0.9 }; rAnkle = { x: 0.54, y: 0.9 };
      } else if (pose === "Sitting") {
        nose = { x: 0.5, y: 0.35 };
        lShoulder = { x: 0.45, y: 0.45 }; rShoulder = { x: 0.55, y: 0.45 };
        lElbow = { x: 0.4, y: 0.55 }; rElbow = { x: 0.6, y: 0.55 };
        lWrist = { x: 0.4, y: 0.65 }; rWrist = { x: 0.6, y: 0.65 };
        lHip = { x: 0.47, y: 0.65 }; rHip = { x: 0.53, y: 0.65 };
        lKnee = { x: 0.4, y: 0.72 }; rKnee = { x: 0.6, y: 0.72 };
        lAnkle = { x: 0.4, y: 0.9 }; rAnkle = { x: 0.6, y: 0.9 };
      } else if (pose === "Hands Raised") {
        nose = { x: 0.5, y: 0.25 };
        lShoulder = { x: 0.45, y: 0.4 }; rShoulder = { x: 0.55, y: 0.4 };
        lElbow = { x: 0.38, y: 0.25 }; rElbow = { x: 0.62, y: 0.25 };
        lWrist = { x: 0.35, y: 0.1 }; rWrist = { x: 0.65, y: 0.1 };
        lHip = { x: 0.46, y: 0.65 }; rHip = { x: 0.54, y: 0.65 };
        lKnee = { x: 0.46, y: 0.78 }; rKnee = { x: 0.54, y: 0.78 };
        lAnkle = { x: 0.46, y: 0.9 }; rAnkle = { x: 0.54, y: 0.9 };
      } else if (pose === "Hands Down") {
        nose = { x: 0.5, y: 0.2 };
        lShoulder = { x: 0.45, y: 0.35 }; rShoulder = { x: 0.55, y: 0.35 };
        lElbow = { x: 0.42, y: 0.55 }; rElbow = { x: 0.58, y: 0.55 };
        lWrist = { x: 0.42, y: 0.75 }; rWrist = { x: 0.58, y: 0.75 };
        lHip = { x: 0.46, y: 0.6 }; rHip = { x: 0.54, y: 0.6 };
        lKnee = { x: 0.46, y: 0.75 }; rKnee = { x: 0.54, y: 0.75 };
        lAnkle = { x: 0.46, y: 0.9 }; rAnkle = { x: 0.54, y: 0.9 };
      } else if (pose === "Lying Down") {
        nose = { x: 0.2, y: 0.45 };
        lShoulder = { x: 0.32, y: 0.45 }; rShoulder = { x: 0.32, y: 0.53 };
        lElbow = { x: 0.4, y: 0.45 }; rElbow = { x: 0.4, y: 0.53 };
        lWrist = { x: 0.48, y: 0.45 }; rWrist = { x: 0.48, y: 0.53 };
        lHip = { x: 0.55, y: 0.46 }; rHip = { x: 0.55, y: 0.52 };
        lKnee = { x: 0.7, y: 0.46 }; rKnee = { x: 0.7, y: 0.52 };
        lAnkle = { x: 0.85, y: 0.46 }; rAnkle = { x: 0.85, y: 0.52 };
      } else if (pose === "Fall Detected") {
        nose = { x: 0.25, y: 0.75 };
        lShoulder = { x: 0.37, y: 0.73 }; rShoulder = { x: 0.37, y: 0.81 };
        lElbow = { x: 0.45, y: 0.70 }; rElbow = { x: 0.45, y: 0.85 };
        lWrist = { x: 0.5, y: 0.68 }; rWrist = { x: 0.5, y: 0.88 };
        lHip = { x: 0.6, y: 0.74 }; rHip = { x: 0.6, y: 0.80 };
        lKnee = { x: 0.73, y: 0.74 }; rKnee = { x: 0.73, y: 0.80 };
        lAnkle = { x: 0.86, y: 0.74 }; rAnkle = { x: 0.86, y: 0.80 };
      }

      // Draw Head Circle
      ctx.beginPath();
      ctx.arc(nose.x * width, nose.y * height, 15, 0, 2 * Math.PI);
      ctx.stroke();

      const drawLine = (pt1, pt2) => {
        ctx.beginPath();
        ctx.moveTo(pt1.x * width, pt1.y * height);
        ctx.lineTo(pt2.x * width, pt2.y * height);
        ctx.stroke();
      };

      // Torso
      drawLine(lShoulder, rShoulder);
      drawLine(lShoulder, lHip);
      drawLine(rShoulder, rHip);
      drawLine(lHip, rHip);

      // Arms
      drawLine(lShoulder, lElbow);
      drawLine(lElbow, lWrist);
      drawLine(rShoulder, rElbow);
      drawLine(rElbow, rWrist);

      // Legs
      drawLine(lHip, lKnee);
      drawLine(lKnee, lAnkle);
      drawLine(rHip, rKnee);
      drawLine(rKnee, rAnkle);
    };

    async function analyzeFrame() {
      if (!active) {
        return;
      }
      
      // If NOT in test mode, we must have a camera feed
      if (!isTestMode && (!localStream || !videoRef.current)) {
        return;
      }

      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      const startTime = Date.now();

      try {
        const canvas = document.createElement("canvas");
        canvas.width = (videoRef.current && videoRef.current.videoWidth) || 640;
        canvas.height = (videoRef.current && videoRef.current.videoHeight) || 480;
        const ctx = canvas.getContext("2d");

        if (videoRef.current && localStream) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        } else {
          // Draw solid background if camera hardware isn't available
          ctx.fillStyle = "#090d16";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        console.log("Frame captured");

        if (isTestMode) {
          // Render mock stick figure on top of canvas
          drawMockSkeleton(ctx, canvas.width, canvas.height, mockActivity);
          const frameBase64 = canvas.toDataURL("image/jpeg");

          // Simulate slight processing overhead
          await new Promise(resolve => setTimeout(resolve, 40));

          const mockLandmarks = generateMockLandmarks();
          let apiActivity = mockActivity;
          if (mockActivity === "Hands Raised") {
            apiActivity = "Both Hands Raised";
          }

          const mockResponse = {
            activity: apiActivity,
            confidence: "95%",
            alert_created: mockActivity === "Fall Detected",
            annotated_frame_base64: frameBase64,
            landmarks_count: 33,
            ai_status: "MediaPipe Active (Test Mode)",
            raw_landmarks: mockLandmarks
          };

          const endTime = Date.now();
          setLatency(endTime - startTime);

          const now = Date.now();
          if (lastFrameTimeRef.current) {
            const fpsVal = (1000 / (now - lastFrameTimeRef.current)).toFixed(1);
            setFps(fpsVal);
          }
          lastFrameTimeRef.current = now;

          console.log("Frame sent to backend (MOCK)");
          console.log("Backend response received (MOCK)", mockResponse);
          console.log("Activity detected (MOCK):", mockResponse.activity);

          const mapped = mapActivity(mockResponse.activity);
          setActivity(mockResponse.activity);
          setConfidence(mockResponse.confidence);
          setLandmarksCount(mockResponse.landmarks_count);
          setEngineStatus("🟢 ONLINE");
          setRawLandmarks(mockResponse.raw_landmarks);
          setAnnotatedFrame(mockResponse.annotated_frame_base64);
          setLastApiResponse(mockResponse);
          setApiError("");

          if (mapped in verifiedPoses) {
            setVerifiedPoses(prev => ({
              ...prev,
              [mapped]: true
            }));
          }
        } else {
          const frameBase64 = canvas.toDataURL("image/jpeg");
          const payload = {
            frame_base64: frameBase64,
            patient_id: "test_suite_patient",
            patient_name: "Verification Suite",
            room_code: "TEST_LAB",
            hospital_id: hospitalId || "hosp_default"
          };

          console.log("Sending frame to backend...");

          const response = await fetch(`${API_BASE_URL}/analyze`, {
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

            console.log("Backend response received:", data);
            console.log("Activity detected:", data.activity);

            const mapped = mapActivity(data.activity);
            setActivity(data.activity || "Unknown");
            setConfidence(data.confidence || "--");
            setLandmarksCount(data.landmarks_count || 0);
            setEngineStatus("🟢 ONLINE");
            setRawLandmarks(data.raw_landmarks || []);
            setAnnotatedFrame(data.annotated_frame_base64 || null);
            setLastApiResponse(data);
            setApiError("");

            if (mapped in verifiedPoses) {
              setVerifiedPoses(prev => ({
                ...prev,
                [mapped]: true
              }));
            }
          } else {
            console.error("Backend error (HTTP status code):", response.status);
            setEngineStatus("🔴 OFFLINE");
            setFps(0);
            setApiError(`HTTP Status Code ${response.status} from /analyze`);
          }
        }
      } catch (err) {
        console.error("Backend error:", err);
        setEngineStatus("🔴 OFFLINE");
        setFps(0);
        setApiError(err.message || "Failed to call backend AI /analyze endpoint");
      } finally {
        isProcessingRef.current = false;
        if (active) {
          timeoutId = setTimeout(analyzeFrame, 250); // Recursive call for ~4 FPS target
        }
      }
    }

    if (isTestMode || localStream) {
      timeoutId = setTimeout(analyzeFrame, 250);
    }

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [localStream, hospitalId, isTestMode, mockActivity, verifiedPoses]);

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

  const landmarkLabels = [
    "Nose", "Left Eye Inner", "Left Eye", "Left Eye Outer", "Right Eye Inner", "Right Eye", "Right Eye Outer",
    "Left Ear", "Right Ear", "Mouth Left", "Mouth Right", "Left Shoulder", "Right Shoulder", "Left Elbow", "Right Elbow",
    "Left Wrist", "Right Wrist", "Left Pinky", "Right Pinky", "Left Index", "Right Index", "Left Thumb", "Right Thumb",
    "Left Hip", "Right Hip", "Left Knee", "Right Knee", "Left Ankle", "Right Ankle", "Left Heel", "Right Heel",
    "Left Foot Index", "Right Foot Index"
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      
      {/* Title Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AI Pose Verification Suite
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Clinical calibration console to test real-time MediaPipe pose classifications.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsTestMode(!isTestMode)}
            className={`px-4 py-2.5 font-bold border rounded-xl text-xs transition cursor-pointer ${
              isTestMode 
                ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20" 
                : "bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-400"
            }`}
          >
            {isTestMode ? "🧪 Disable Test Mode" : "🧪 Enable Test Mode"}
          </button>

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
            🔄 Reset Checklist
          </button>
        </div>
      </div>

      {/* Test Mode Mock Detections Console */}
      {isTestMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <span>🧪</span> Mock Detections Active
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select a posture below to simulate real-time AI classification on the canvas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Standing", "Sitting", "Hands Raised", "Hands Down", "Lying Down", "Fall Detected"].map((pose) => (
              <button
                key={pose}
                onClick={() => setMockActivity(pose)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  mockActivity === pose
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                    : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
                }`}
              >
                {pose}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Webcam Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            {/* Telemetry Bar */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">Engine Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  engineStatus.includes("ONLINE") 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {engineStatus}
                </span>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <span className="font-bold">Landmarks Extracted:</span>{" "}
                  <span className="font-bold text-slate-200">
                    {landmarksCount > 0 ? `${landmarksCount} / 33` : "MediaPipe unavailable - YOLO fallback active"}
                  </span>
                </div>
                <div>
                  <span className="font-bold">Rate:</span>{" "}
                  <span className="font-semibold text-slate-200">{fps > 0 ? `${fps} FPS` : "--"}</span>
                </div>
                <div>
                  <span className="font-bold">Latency:</span>{" "}
                  <span className="font-semibold text-slate-200">{latency > 0 ? `${latency} ms` : "--"}</span>
                </div>
              </div>
            </div>

            {/* Video Preview */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {streamError && !isTestMode ? (
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
                  <span className={`font-extrabold text-sm ${mappedActivity === "Fall Detected" ? "text-red-400" : "text-green-400"}`}>
                    {activity}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Confidence Score</span>
                  <span className="font-extrabold text-sm text-slate-100">{confidence}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Posture Checklist Matrix */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📋</span> Posture Verification Matrix
            </h3>
            
            <div className="space-y-4">
              {Object.keys(verifiedPoses).map(pose => {
                const isCurrent = mappedActivity === pose;
                return (
                  <div 
                    key={pose}
                    className={`border p-4 rounded-xl flex items-start gap-3 transition duration-200 ${
                      isCurrent 
                        ? "bg-purple-500/15 border-purple-500 text-purple-300 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10" 
                        : verifiedPoses[pose] 
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
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-black uppercase ${
                          isCurrent 
                            ? "text-purple-300" 
                            : verifiedPoses[pose] 
                              ? "text-green-300" 
                              : "text-slate-300"
                        }`}>
                          {pose}
                        </h4>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 bg-purple-500/25 text-purple-300 rounded text-[8px] font-black uppercase animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        {poseGuidelines[pose]}
                      </p>
                    </div>
                  </div>
                );
              })}
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
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time developer diagnostics, connection configurations, and raw landmark frames.</p>
            </div>
          </div>

          {/* Diagnosis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Backend URL</span>
              <span className="font-mono text-xs text-slate-300 break-all">{`${API_BASE_URL}/analyze`}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Last Detected Activity</span>
              <span className="font-extrabold text-xs text-green-400">{activity || "--"}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Last Confidence Score</span>
              <span className="font-extrabold text-xs text-slate-200">{confidence || "--"}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Error Messages</span>
              <span className={`font-mono text-xs font-bold ${apiError ? "text-red-400" : "text-green-400"}`}>
                {apiError || "No errors detected."}
              </span>
            </div>
          </div>

          {/* Last Response Payload JSON */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Last API Response Payload</span>
            <pre className="p-3 bg-slate-950 border border-slate-850 rounded-xl overflow-x-auto text-[10px] text-purple-300 font-mono max-h-[160px] custom-scrollbar">
              {lastApiResponse ? JSON.stringify(lastApiResponse, null, 2) : "No API responses received yet."}
            </pre>
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
                        MediaPipe unavailable - YOLO fallback active
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

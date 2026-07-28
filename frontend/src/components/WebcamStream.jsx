import { useEffect, useRef, useState } from "react";

export default function WebcamStream({ patientId, patientName, roomCode, hospitalId, compact = false }) {
  const videoRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState("Closed"); // "Closed", "Connecting", "Streaming", "Error"
  const [errorMsg, setErrorMsg] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolution, setResolution] = useState("N/A");

  const canvasRef = useRef(null);

  // Enumerate devices on mount
  useEffect(() => {
    async function getDevices() {
      try {
        let videoDevices = [];
        try {
          await navigator.mediaDevices.getUserMedia({ video: true }).then((initialStream) => {
            initialStream.getTracks().forEach(track => track.stop());
          }).catch(() => {});
          const devices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = devices.filter(device => device.kind === "videoinput");
        } catch (e) {
          console.warn("Browser camera permission denied or unavailable:", e.message);
        }

        // Add virtual simulation camera device
        videoDevices.push({
          deviceId: "virtual-telemetry",
          label: "Virtual Telemetry Simulator (Diagnostic Feed)"
        });

        setCameras(videoDevices);
        setSelectedCameraId("virtual-telemetry");
      } catch (err) {
        console.error("Error listing cameras:", err);
        setCameras([{ deviceId: "virtual-telemetry", label: "Virtual Telemetry Simulator" }]);
        setSelectedCameraId("virtual-telemetry");
      }
    }
    getDevices();
  }, []);

  // Handle stream lifecycle based on selectedCameraId
  const startCamera = async (deviceId) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStatus("Connecting");
    setErrorMsg("");

    if (deviceId === "virtual-telemetry") {
      setStream(null);
      setStatus("Streaming");
      setResolution("1280x720");
      return;
    }

    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus("Streaming");

      // Read resolution
      const track = mediaStream.getVideoTracks()[0];
      const settings = track.getSettings();
      if (settings && settings.width && settings.height) {
        setResolution(`${settings.width}x${settings.height}`);
      } else {
        setResolution("Dynamic");
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      setStatus("Error");
      setErrorMsg("Failed to open stream. Falling back to Virtual Simulation.");
      setSelectedCameraId("virtual-telemetry");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("Closed");
    setResolution("N/A");
  };

  // Auto-start camera when selectedCameraId changes
  useEffect(() => {
    if (selectedCameraId) {
      startCamera(selectedCameraId);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCameraId]);

  // Loop to draw electrocardiogram and clinical telemetry onto canvas if virtual
  useEffect(() => {
    if (selectedCameraId !== "virtual-telemetry" || status !== "Streaming") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    const points = [];
    const maxPoints = 250;

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.fillStyle = "rgba(10, 15, 30, 0.2)"; // Fade trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = "rgba(30, 41, 59, 0.3)";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw scanline
      const scanY = (Date.now() / 8) % canvas.height;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      // ECG wave math
      const time = Date.now() / 120;
      let y = canvas.height / 2;
      
      const cycle = time % (2 * Math.PI);
      if (cycle < 0.25) {
        y -= Math.sin(cycle * 4) * 35; // R wave
      } else if (cycle >= 0.25 && cycle < 0.5) {
        y += Math.sin((cycle - 0.25) * 4) * 15; // S wave
      } else if (cycle >= 0.7 && cycle < 1.1) {
        y -= Math.sin((cycle - 0.7) * Math.PI) * 8; // T wave
      }

      points.push({ x: canvas.width - 40, y });
      if (points.length > maxPoints) {
        points.shift();
      }

      ctx.beginPath();
      ctx.strokeStyle = "#10b981"; // Emerald green
      ctx.lineWidth = 2.5;
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const screenX = pt.x - (points.length - i) * 2;
        if (i === 0) {
          ctx.moveTo(screenX, pt.y);
        } else {
          ctx.lineTo(screenX, pt.y);
        }
      }
      ctx.stroke();

      // Telemetry Text
      ctx.fillStyle = "#3b82f6";
      ctx.font = "bold 12px monospace";
      ctx.fillText("ECG MONITOR (V1)", 20, 30);

      ctx.fillStyle = "#ef4444";
      ctx.fillText(`HR: ${Math.floor(70 + Math.sin(time / 8) * 5)} bpm`, 20, 50);

      ctx.fillStyle = "#10b981";
      ctx.fillText("TELEMETRY CHANNEL 1", canvas.width - 160, 30);

      ctx.fillStyle = "#64748b";
      ctx.fillText(new Date().toLocaleTimeString(), canvas.width - 160, 50);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [selectedCameraId, status]);

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (cameras.length === 0 && status === "Error" && errorMsg === "No Camera Connected") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 min-h-[200px] text-center w-full">
        <span className="text-4xl mb-2">📹</span>
        <p className="text-sm font-bold text-red-400">No Camera Connected</p>
        <p className="text-xs text-slate-500 mt-1">Please connect a Laptop Webcam, USB Webcam, or External Camera.</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col w-full ${compact ? "max-w-md" : "w-full"}`}>
      {/* Video container */}
      <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden w-full">
        {selectedCameraId === "virtual-telemetry" ? (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Status badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
          <span className={`px-2 py-0.5 text-[9px] font-black text-white rounded uppercase tracking-wider flex items-center gap-1 ${
            status === "Streaming" ? "bg-green-600 animate-pulse" :
            status === "Connecting" ? "bg-yellow-600 animate-pulse" : "bg-slate-700"
          }`}>
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            {status}
          </span>
          {roomCode && (
            <span className="px-2 py-0.5 bg-slate-950/80 text-[9px] font-bold text-slate-300 rounded">
              Room {roomCode}
            </span>
          )}
          {patientName && (
            <span className="px-2 py-0.5 bg-slate-950/80 text-[9px] font-bold text-slate-300 rounded truncate max-w-[120px]">
              Patient: {patientName}
            </span>
          )}
        </div>

        {/* Resolution overlay */}
        <div className="absolute bottom-3 right-3 bg-slate-950/80 px-2 py-0.5 text-[9px] font-semibold text-slate-400 rounded pointer-events-none">
          {resolution}
        </div>

        {status === "Error" && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-1">⚠️</span>
            <p className="text-xs font-bold text-red-400">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="bg-slate-950 border-t border-slate-800 p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none w-full sm:w-48 cursor-pointer"
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === "Streaming" ? (
            <button
              onClick={stopCamera}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => startCamera(selectedCameraId)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
            >
              Start
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
          >
            Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}

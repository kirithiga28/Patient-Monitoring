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

  // Enumerate devices on mount
  useEffect(() => {
    async function getDevices() {
      try {
        // Request initial permission to get device labels
        await navigator.mediaDevices.getUserMedia({ video: true }).then((initialStream) => {
          initialStream.getTracks().forEach(track => track.stop());
        }).catch(() => {});

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        } else {
          setStatus("Error");
          setErrorMsg("No Camera Connected");
        }
      } catch (err) {
        console.error("Error listing cameras:", err);
        setStatus("Error");
        setErrorMsg("No Camera Connected");
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
      setErrorMsg("Failed to open stream");
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
      <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
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

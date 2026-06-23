import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { cameraService } from "../services/cameraService";
import { patientService } from "../services/patientService";
import WebcamStream from "../components/WebcamStream";

export default function Cameras() {
  const { role, hospitalId } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [activePreviewId, setActivePreviewId] = useState(null);

  // Add camera form state
  const [formData, setFormData] = useState({
    name: "",
    room: "",
    streamUrl: "webcam",
    type: "Webcam",
    patientId: ""
  });

  useEffect(() => {
    const unsubCameras = cameraService.listenCameras(role, hospitalId, (cameraList) => {
      setCameras(cameraList);
      setLoading(false);
    });

    const unsubPatients = patientService.listenPatients(role, hospitalId, null, null, (patientList) => {
      setPatients(patientList);
    });

    return () => {
      unsubCameras();
      unsubPatients();
    };
  }, [role, hospitalId]);

  const handlePreview = (camera) => {
    if (activePreviewId === camera.id) {
      setActivePreviewId(null);
    } else {
      setActivePreviewId(camera.id);
    }
  };

  const handleAddCamera = async (e) => {
    e.preventDefault();
    try {
      await cameraService.addCamera({
        ...formData,
        status: "Active",
        hospitalId
      });
      alert("Camera Added successfully");
      setIsAdding(false);
      setFormData({ name: "", room: "", streamUrl: "webcam", type: "Webcam", patientId: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to create camera definition");
    }
  };

  const handleDeleteCamera = async (id) => {
    if (id === activePreviewId) {
      setActivePreviewId(null);
    }
    try {
      await cameraService.deleteCamera(id);
      alert("Camera Deleted");
    } catch (error) {
      console.error(error);
      alert("Failed to delete camera");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-sm">Mapping Streaming Infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Camera Device Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Register and monitor Webcams, USB cameras, IP nodes, and RTSP streams.
          </p>
        </div>

        {role !== "caregiver" && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {isAdding ? "Close Panel" : "➕ Register Device"}
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddCamera} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 max-w-2xl">
          <h2 className="text-lg font-bold">Register Camera Mapping</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Camera Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Room 105 Fall Monitor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Room Code</label>
              <input
                type="text"
                required
                placeholder="e.g. 105"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Device Interface Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, streamUrl: e.target.value === "Webcam" ? "webcam" : "" })}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs text-white"
              >
                <option value="Webcam">Integrated Webcam</option>
                <option value="USB">USB Camera</option>
                <option value="IP">IP Node (HTTP/MJPEG)</option>
                <option value="RTSP">RTSP Server Feed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Stream Address / URL</label>
              <input
                type="text"
                required
                disabled={formData.type === "Webcam"}
                placeholder={formData.type === "Webcam" ? "Uses browser default camera" : "e.g. rtsp://192.168.1.100:554/stream1"}
                value={formData.streamUrl}
                onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs text-white disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1">Assign Patient Link</label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs text-white"
              >
                <option value="">No Patient Assigned</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Room {p.room})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Add Camera Mapping
          </button>
        </form>
      )}

      {/* Camera Live Preview Layout */}
      {activePreviewId && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            Live Telemetry View - {cameras.find(c => c.id === activePreviewId)?.name}
          </h2>
          
          <div className="relative aspect-video max-w-3xl w-full bg-black rounded-xl overflow-hidden border border-slate-800 mx-auto flex items-center justify-center">
            {cameras.find(c => c.id === activePreviewId)?.type === "Webcam" || cameras.find(c => c.id === activePreviewId)?.type === "USB" ? (
              <WebcamStream
                patientId={cameras.find(c => c.id === activePreviewId)?.patientId}
                patientName={patients.find(p => p.id === cameras.find(c => c.id === activePreviewId)?.patientId)?.name || "Unknown Patient"}
                roomCode={cameras.find(c => c.id === activePreviewId)?.room || "101"}
                hospitalId={hospitalId}
              />
            ) : (
              <div className="text-slate-500 text-center space-y-2">
                <span className="text-5xl block">📹</span>
                <p className="text-sm font-semibold">IP/RTSP Stream Address Connection Open</p>
                <p className="text-xs text-slate-600">Address: {cameras.find(c => c.id === activePreviewId)?.streamUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of registered cameras */}
      <div className="grid md:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <div key={camera.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow hover:border-slate-700 transition space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-extrabold text-lg">{camera.name}</h3>
                <span className="text-[10px] font-black uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-750">
                  {camera.type}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p><span className="text-slate-500 font-semibold">Room:</span> {camera.room}</p>
                <p><span className="text-slate-500 font-semibold">Patient:</span> {patients.find(p => p.id === camera.patientId)?.name || "Not Assigned"}</p>
                <p className="truncate"><span className="text-slate-500 font-semibold">Source:</span> {camera.streamUrl}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-850">
              <button
                onClick={() => handlePreview(camera)}
                className={`flex-1 py-2 text-white rounded-xl text-xs font-bold transition cursor-pointer ${
                  activePreviewId === camera.id ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {activePreviewId === camera.id ? "Stop Feed" : "📺 Live View"}
              </button>

              {role !== "caregiver" && (
                <button
                  onClick={() => handleDeleteCamera(camera.id)}
                  className="px-3 bg-slate-950 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-slate-850 hover:border-red-500/20 rounded-xl text-xs transition cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {cameras.length === 0 && (
          <p className="text-center text-slate-500 py-12 text-sm col-span-3">No monitoring cameras registered. Add one above.</p>
        )}
      </div>
    </div>
  );
}

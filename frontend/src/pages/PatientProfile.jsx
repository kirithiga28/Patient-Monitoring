import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import { vitalsService } from "../services/vitalsService";
import { alertService } from "../services/alertService";
import { formatDateTime } from "../utils/dateFormatter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts";

export default function PatientProfile({ patient, onBack }) {
  const { role, hospitalId, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [editing, setEditing] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [patientAlerts, setPatientAlerts] = useState([]);
  
  const [formData, setFormData] = useState({
    name: patient.name || "",
    age: patient.age || "",
    gender: patient.gender || "Male",
    bloodGroup: patient.bloodGroup || "",
    room: patient.room || "",
    diagnosis: patient.diagnosis || "",
    status: patient.status || "",
    doctor: patient.doctor || "",
    contact: patient.contact || "",
    history: patient.history || "",
    riskScore: patient.riskScore || 10,
    admissionDate: patient.admissionDate || ""
  });

  // Vitals form
  const [newVitals, setNewVitals] = useState({
    heartRate: patient.vitals?.heartRate || 75,
    temperature: patient.vitals?.temperature || 98.6,
    bloodPressure: patient.vitals?.bloodPressure || "120/80",
    oxygenSaturation: patient.vitals?.oxygenSaturation || 98,
    respiratoryRate: patient.vitals?.respiratoryRate || 16,
  });

  const [savingVitals, setSavingVitals] = useState(false);

  useEffect(() => {
    loadTimelineData();
  }, [patient.id]);

  const loadTimelineData = async () => {
    try {
      // 1. Fetch vitals log
      const vitals = await vitalsService.getVitalsHistory(patient.id);
      setVitalsHistory(vitals);

      // 2. Listen to alerts for this patient in real-time
      const unsubscribe = alertService.listenAlerts(role, hospitalId, (alertList) => {
        setPatientAlerts(alertList.filter(a => a.patientId === patient.id));
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading profile logs:", error);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this patient profile?");
    if (!confirmDelete) return;

    try {
      await patientService.deletePatient(patient.id);
      alert("Patient Deleted Successfully");
      onBack();
    } catch (error) {
      console.error(error);
      alert("Error deleting patient");
    }
  };

  const handleSave = async () => {
    try {
      await patientService.updatePatient(patient.id, formData);
      alert("Patient Profile Updated");
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert("Error updating patient");
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    setSavingVitals(true);
    try {
      await vitalsService.recordVitals(patient.id, newVitals, hospitalId);
      alert("Vitals Scan Logged");
      await loadTimelineData();
    } catch (error) {
      console.error(error);
      alert("Error logging vitals");
    } finally {
      setSavingVitals(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVitalsChange = (e) => {
    setNewVitals({
      ...newVitals,
      [e.target.name]: e.target.value,
    });
  };

  // Compile timeline events
  const timelineEvents = [
    {
      title: "Patient Admitted",
      type: "admission",
      time: formData.admissionDate,
      desc: `Registered to Room ${formData.room} under ${formData.doctor}. Diagnosis: ${formData.diagnosis}`
    },
    ...vitalsHistory.map(v => ({
      title: "Telemetry Vital Scan",
      type: "vital",
      time: v.timestamp,
      desc: `SpO2: ${v.oxygenSaturation}% • HR: ${v.heartRate}bpm • BP: ${v.bloodPressure} • Temp: ${v.temperature}°F`
    })),
    ...patientAlerts.map(a => ({
      title: `AI Alert Triggered: ${a.alertType}`,
      type: "alert",
      time: a.timestamp,
      desc: `Severity: ${a.severity} • Status: ${a.status}. Resolution: ${a.notes || "Awaiting action."}`
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Activities logs list matching patient room observations
  const activityLogs = [
    { activity: "Sleeping", confidence: "98%", time: "Recent", risk: "Low" },
    { activity: "Sitting", confidence: "94%", time: "2 hrs ago", risk: "Low" },
    { activity: "Walking", confidence: "92%", time: "4 hrs ago", risk: "Low" }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <button
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          ← Back Directory
        </button>

        {role !== "caregiver" && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/30 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {editing ? "Cancel Edit" : "✏️ Edit Profile"}
            </button>
            {(role === "super_admin" || role === "hospital_admin") && (
              <button
                onClick={handleDelete}
                className="bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-950/60 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                🗑️ Delete Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {formData.name?.split(" ").map(n => n[0]).join("") || "P"}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{formData.name}</h1>
            <p className="text-slate-400 text-xs mt-0.5">Room {formData.room} • Attending: {formData.doctor}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center bg-slate-950/40 px-4 py-2 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Risk Tier</span>
            <span className={`font-black text-lg ${
              formData.riskScore > 75 ? "text-red-400" :
              formData.riskScore > 50 ? "text-orange-400" :
              formData.riskScore > 25 ? "text-yellow-400" :
              "text-green-400"
            }`}>
              {formData.riskScore}%
            </span>
          </div>

          <div className="text-center bg-slate-950/40 px-4 py-2 rounded-xl border border-slate-850">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Condition</span>
            <span className={`text-xs font-black uppercase inline-block mt-0.5 ${
              formData.status === "Critical" ? "text-red-400" :
              formData.status === "Observation" ? "text-yellow-400" :
              "text-green-400"
            }`}>
              {formData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-850">
        {["details", "timeline", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs font-bold border-b-2 capitalize transition cursor-pointer ${
              activeTab === tab ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab === "details" ? "📋 Clinical details" : tab === "timeline" ? "📈 Event Timeline" : "🧠 Activity History"}
          </button>
        ))}
      </div>

      {/* Tab contents */}
      {activeTab === "details" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
            <h2 className="text-lg font-bold border-b border-slate-850 pb-2">Patient Details</h2>
            
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-bold">Gender</span>
                <span>
                  {editing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    formData.gender
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-bold">Blood Group</span>
                <span>
                  {editing ? (
                    <input
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 w-20 text-center rounded text-white"
                    />
                  ) : (
                    formData.bloodGroup
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-bold">Admission Date</span>
                <span>
                  {editing ? (
                    <input
                      name="admissionDate"
                      type="date"
                      value={formData.admissionDate}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-white"
                    />
                  ) : (
                    formData.admissionDate
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-bold">Emergency Contact</span>
                <span>
                  {editing ? (
                    <input
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-white"
                    />
                  ) : (
                    formData.contact
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-bold">Primary Doctor</span>
                <span>
                  {editing ? (
                    <input
                      name="doctor"
                      value={formData.doctor}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-white"
                    />
                  ) : (
                    formData.doctor
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-bold">Diagnosis</span>
                <span>
                  {editing ? (
                    <input
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-white"
                    />
                  ) : (
                    formData.diagnosis
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="text-slate-500 font-bold">Medical History Background</h3>
              {editing ? (
                <textarea
                  name="history"
                  value={formData.history}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl h-24 outline-none text-white"
                />
              ) : (
                <p className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl leading-relaxed text-slate-400">
                  {formData.history || "No medical history documented."}
                </p>
              )}
            </div>

            {editing && (
              <button
                onClick={handleSave}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                💾 Save Profile Changes
              </button>
            )}
          </div>

          {/* Vitals side logger */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-lg font-bold border-b border-slate-850 pb-2">⚡ Vital Status</h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">SpO2 (Oxygen):</span>
                <span className="font-bold text-blue-400">{patient.vitals?.oxygenSaturation || "--"}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Heart Rate:</span>
                <span className="font-bold text-red-400">{patient.vitals?.heartRate || "--"} bpm</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Blood Pressure:</span>
                <span className="font-bold text-green-400">{patient.vitals?.bloodPressure || "--"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Body Temp:</span>
                <span className="font-bold text-orange-400">{patient.vitals?.temperature || "--"} °F</span>
              </div>
            </div>

            {role !== "caregiver" && (
              <form onSubmit={handleRecordVitals} className="pt-4 border-t border-slate-850 space-y-3">
                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Log Vital Scan</h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <input
                    type="number"
                    name="heartRate"
                    placeholder="HR (bpm)"
                    required
                    value={newVitals.heartRate}
                    onChange={handleVitalsChange}
                    className="bg-slate-950 border border-slate-850 p-2 rounded text-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    placeholder="Temp (°F)"
                    required
                    value={newVitals.temperature}
                    onChange={handleVitalsChange}
                    className="bg-slate-950 border border-slate-850 p-2 rounded text-white"
                  />
                  <input
                    type="text"
                    name="bloodPressure"
                    placeholder="BP (120/80)"
                    required
                    value={newVitals.bloodPressure}
                    onChange={handleVitalsChange}
                    className="bg-slate-950 border border-slate-850 p-2 rounded text-white"
                  />
                  <input
                    type="number"
                    name="oxygenSaturation"
                    placeholder="SpO2 (%)"
                    required
                    value={newVitals.oxygenSaturation}
                    onChange={handleVitalsChange}
                    className="bg-slate-950 border border-slate-850 p-2 rounded text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingVitals}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                >
                  {savingVitals ? "Saving..." : "Record Scan"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Chronological Event Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold border-b border-slate-850 pb-2">Incidents & Health Timeline</h2>
          
          <div className="relative border-l border-slate-800 ml-4 space-y-6">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative pl-6">
                {/* Dot indicator */}
                <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${
                  evt.type === "admission" ? "bg-green-500" :
                  evt.type === "alert" ? "bg-red-500 animate-pulse" :
                  "bg-blue-500"
                }`}></span>
                
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px]">{formatDateTime(evt.time)}</p>
                  <p className="font-extrabold text-sm text-slate-200">{evt.title}</p>
                  <p className="text-xs text-slate-400">{evt.desc}</p>
                </div>
              </div>
            ))}

            {timelineEvents.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-8">No events logged on this patient.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Detected Behavior logs */}
      {activeTab === "activity" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold border-b border-slate-850 pb-2">AI Camera Behavior logs</h2>
          
          <div className="space-y-3">
            {activityLogs.map((log, index) => (
              <div key={index} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-200">Activity Observed: {log.activity}</p>
                  <p className="text-slate-400">Time: {log.time} • Confidence: {log.confidence}</p>
                </div>
                <span className="text-[10px] font-black uppercase text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                  Risk Level: {log.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vitals charts */}
      {vitalsHistory.length > 0 && activeTab === "details" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold border-b border-slate-850 pb-2">📉 Vitals Scan Timeline</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vitalsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                  stroke="#64748b" 
                  fontSize={10} 
                />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  labelFormatter={(t) => formatDateTime(t)} 
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="heartRate" stroke="#f43f5e" name="HR (bpm)" strokeWidth={2} />
                <Line type="monotone" dataKey="oxygenSaturation" stroke="#3b82f6" name="SpO2 (%)" strokeWidth={2} />
                <Line type="monotone" dataKey="temperature" stroke="#f97316" name="Temp (°F)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

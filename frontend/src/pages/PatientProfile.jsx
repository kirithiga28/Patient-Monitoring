import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import { vitalsService } from "../services/vitalsService";
import { alertService } from "../services/alertService";
import { activityService } from "../services/activityService";
import { clinicalService } from "../services/clinicalService";
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
  const { role, hospitalId, userData } = useAuth();
  const [localPatient, setLocalPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [selectorLoading, setSelectorLoading] = useState(true);

  // Determine active patient record
  const currentPatient = patient || localPatient;

  const [activeTab, setActiveTab] = useState("details");
  const [editing, setEditing] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [patientAlerts, setPatientAlerts] = useState([]);
  const [patientActivities, setPatientActivities] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  // Medical Record Form state
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [recordForm, setRecordForm] = useState({
    type: "Diagnosis",
    title: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    doctor: userData?.name || ""
  });

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "",
    room: "",
    diagnosis: "",
    status: "",
    doctor: "",
    contact: "",
    address: "",
    history: "",
    riskScore: 10,
    admissionDate: ""
  });

  // Vitals form
  const [newVitals, setNewVitals] = useState({
    heartRate: 75,
    temperature: 98.6,
    bloodPressure: "120/80",
    oxygenSaturation: 98,
    respiratoryRate: 16
  });

  const [savingVitals, setSavingVitals] = useState(false);

  // Effect to load patient list if no patient prop is passed
  useEffect(() => {
    if (!patient) {
      setSelectorLoading(true);
      const unsubscribe = patientService.listenPatients(
        "doctor",
        hospitalId,
        null,
        null,
        (list) => {
          setAllPatients(list);
          setSelectorLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [patient, hospitalId]);

  // Sync state with selected patient
  useEffect(() => {
    if (currentPatient) {
      setFormData({
        name: currentPatient.name || "",
        age: currentPatient.age || "",
        gender: currentPatient.gender || "Male",
        bloodGroup: currentPatient.bloodGroup || "",
        room: currentPatient.room || "",
        diagnosis: currentPatient.diagnosis || "",
        status: currentPatient.status || "Stable",
        doctor: currentPatient.doctor || "",
        contact: currentPatient.contact || "",
        address: currentPatient.address || "",
        history: currentPatient.history || "",
        riskScore: currentPatient.riskScore || 10,
        admissionDate: currentPatient.admissionDate || ""
      });

      setNewVitals({
        heartRate: currentPatient.vitals?.heartRate || 75,
        temperature: currentPatient.vitals?.temperature || 98.6,
        bloodPressure: currentPatient.vitals?.bloodPressure || "120/80",
        oxygenSaturation: currentPatient.vitals?.oxygenSaturation || 98,
        respiratoryRate: currentPatient.vitals?.respiratoryRate || 16
      });

      // Load patient-specific data
      let unsubscribeAlerts;
      let unsubscribeActivities;
      let unsubscribeRecords;

      async function fetchHistory() {
        try {
          const vList = await vitalsService.getVitalsHistory(currentPatient.id);
          setVitalsHistory(vList);
        } catch (e) {
          console.error("Error loading vitals history:", e);
        }
      }
      fetchHistory();

      unsubscribeAlerts = alertService.listenAlerts("doctor", hospitalId, (alertList) => {
        setPatientAlerts(alertList.filter(a => a.patientId === currentPatient.id));
      });

      unsubscribeActivities = activityService.listenActivities("doctor", hospitalId, (activitiesList) => {
        setPatientActivities(activitiesList.filter(a => a.patientId === currentPatient.id));
      });

      unsubscribeRecords = clinicalService.listenMedicalRecords(currentPatient.id, (recordsList) => {
        setMedicalRecords(recordsList);
      });

      return () => {
        if (unsubscribeAlerts) unsubscribeAlerts();
        if (unsubscribeActivities) unsubscribeActivities();
        if (unsubscribeRecords) unsubscribeRecords();
      };
    }
  }, [currentPatient, hospitalId]);

  // Set default doctor name for forms on mount/load
  useEffect(() => {
    if (userData?.name) {
      setRecordForm(prev => ({ ...prev, doctor: userData.name }));
    }
  }, [userData]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this patient profile?");
    if (!confirmDelete) return;

    try {
      await patientService.deletePatient(currentPatient.id);
      alert("Patient Record Deleted");
      if (onBack) {
        onBack();
      } else {
        setLocalPatient(null);
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting patient");
    }
  };

  const handleSave = async () => {
    try {
      await patientService.updatePatient(currentPatient.id, formData);
      alert("Patient Profile Updated");
      setEditing(false);
      
      // Update local state if selector was used
      if (!patient && localPatient) {
        setLocalPatient(prev => ({ ...prev, ...formData }));
      }
    } catch (error) {
      console.error(error);
      alert("Error updating patient profile");
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    setSavingVitals(true);
    try {
      await vitalsService.recordVitals(currentPatient.id, newVitals, hospitalId);
      alert("Vitals Scan Logged");
      // Reload vitals history chart
      const vList = await vitalsService.getVitalsHistory(currentPatient.id);
      setVitalsHistory(vList);
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
      [e.target.name]: e.target.value
    });
  };

  const handleVitalsChange = (e) => {
    setNewVitals({
      ...newVitals,
      [e.target.name]: e.target.value
    });
  };

  // Medical Record Form Handlers
  const handleRecordFormChange = (e) => {
    setRecordForm({
      ...recordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddOrUpdateRecord = async (e) => {
    e.preventDefault();
    try {
      if (editingRecordId) {
        await clinicalService.updateMedicalRecord(editingRecordId, recordForm);
        alert("Medical Record Updated");
      } else {
        await clinicalService.addMedicalRecord({
          ...recordForm,
          patientId: currentPatient.id,
          hospitalId
        });
        alert("Medical Record Added");
      }
      setIsAddingRecord(false);
      setEditingRecordId(null);
      setRecordForm({
        type: "Diagnosis",
        title: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        doctor: userData?.name || ""
      });
    } catch (err) {
      console.error(err);
      alert("Error saving medical record");
    }
  };

  const handleEditRecord = (rec) => {
    setEditingRecordId(rec.id);
    setRecordForm({
      type: rec.type || "Diagnosis",
      title: rec.title || "",
      date: rec.date || new Date().toISOString().split("T")[0],
      description: rec.description || "",
      doctor: rec.doctor || userData?.name || ""
    });
    setIsAddingRecord(true);
  };

  const handleDeleteRecord = async (recId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this medical record?");
    if (!confirmDelete) return;
    try {
      await clinicalService.deleteMedicalRecord(recId);
      alert("Record Deleted");
    } catch (err) {
      console.error(err);
      alert("Error deleting record");
    }
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
      desc: `SpO2: ${v.oxygenSaturation}% • HR: ${v.heartRate}bpm • BP: ${v.bloodPressure} • Temp: ${v.temperature}°F • RR: ${v.respiratoryRate || 16}rpm`
    })),
    ...patientAlerts.map(a => ({
      title: `Telemetry Alert: ${a.alertType}`,
      type: "alert",
      time: a.timestamp,
      desc: `Severity: ${a.severity} • Status: ${a.status}. Resolution: ${a.notes || "Awaiting action."}`
    })),
    ...patientActivities.slice(0, 15).map(act => ({
      title: `Log Activity: ${act.activity}`,
      type: "activity",
      time: act.timestamp,
      desc: `Observed status: ${act.activity} with confidence score: ${act.confidence || "100%"}`
    }))
  ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

  // Render Selector view if accessed via direct sidebar tab without pre-selected patient
  if (!patient && !localPatient) {
    if (selectorLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-sm">Accessing patient database...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Patient Profiles Tab
          </h1>
          <p className="text-slate-400 text-xs mt-1">Select a patient below to view and manage their clinical profile, medical records, and vitals history.</p>
        </div>

        {allPatients.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
            No patients registered in this hospital. Go to the Patients Directory to add one.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {allPatients.map(p => (
              <div
                key={p.id}
                onClick={() => setLocalPatient(p)}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-blue-500/40 cursor-pointer shadow hover:shadow-xl transition flex justify-between items-center group"
              >
                <div>
                  <h2 className="font-extrabold text-lg text-slate-100 group-hover:text-blue-400 transition">{p.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">Age: {p.age} • Room {p.room} • Diagnosis: {p.diagnosis}</p>
                </div>
                <span className="text-blue-500 text-xs font-bold group-hover:translate-x-1 transition-transform block">View Profile →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <button
          onClick={onBack ? onBack : () => setLocalPatient(null)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          ← Back
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/30 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {editing ? "Cancel Edit" : "✏️ Edit Profile"}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-950/60 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            🗑️ Delete Record
          </button>
        </div>
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
        {["details", "medical", "timeline", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs font-bold border-b-2 capitalize transition cursor-pointer ${
              activeTab === tab ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab === "details" ? "📋 Clinical details" : tab === "medical" ? "📁 Medical Records" : tab === "timeline" ? "📈 Event Timeline" : "🧠 Activity History"}
          </button>
        ))}
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
            <h2 className="text-lg font-bold border-b border-slate-850 pb-2">Patient Information</h2>
            
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
                <span className="text-slate-500 font-bold">Patient Name</span>
                <span>
                  {editing ? (
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-white"
                    />
                  ) : (
                    formData.name
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
                <span className="text-slate-500 font-bold">Age</span>
                <span>
                  {editing ? (
                    <input
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 w-20 text-center rounded text-white"
                    />
                  ) : (
                    formData.age
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
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

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
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

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
                <span className="text-slate-500 font-bold">Room Number</span>
                <span>
                  {editing ? (
                    <input
                      name="room"
                      value={formData.room}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-white"
                    />
                  ) : (
                    formData.room
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
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

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
                <span className="text-slate-500 font-bold">Phone Number</span>
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

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
                <span className="text-slate-500 font-bold">Attending Doctor</span>
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

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2">
                <span className="text-slate-500 font-bold">Address</span>
                <span>
                  {editing ? (
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1.5 w-full rounded text-white"
                    />
                  ) : (
                    formData.address
                  )}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2">
                <span className="text-slate-500 font-bold">Medical Condition</span>
                <span>
                  {editing ? (
                    <input
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleChange}
                      className="bg-slate-950 border border-slate-800 p-1.5 w-full rounded text-white"
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
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl h-24 outline-none text-white text-xs"
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
                <span className="font-bold text-blue-400">{currentPatient.vitals?.oxygenSaturation || "--"}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Heart Rate:</span>
                <span className="font-bold text-red-400">{currentPatient.vitals?.heartRate || "--"} bpm</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Blood Pressure:</span>
                <span className="font-bold text-green-400">{currentPatient.vitals?.bloodPressure || "--"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Body Temp:</span>
                <span className="font-bold text-orange-400">{currentPatient.vitals?.temperature || "--"} °F</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">Respiratory Rate:</span>
                <span className="font-bold text-teal-400">{currentPatient.vitals?.respiratoryRate || "--"} rpm</span>
              </div>
            </div>

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
                <input
                  type="number"
                  name="respiratoryRate"
                  placeholder="RR (rpm)"
                  required
                  value={newVitals.respiratoryRate}
                  onChange={handleVitalsChange}
                  className="bg-slate-950 border border-slate-850 p-2 rounded text-white col-span-2"
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
          </div>
        </div>
      )}

      {/* Tab 2: Medical Records */}
      {activeTab === "medical" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <h2 className="text-lg font-bold">Medical Records Portfolio</h2>
            <button
              onClick={() => {
                setIsAddingRecord(!isAddingRecord);
                setEditingRecordId(null);
                setRecordForm({
                  type: "Diagnosis",
                  title: "",
                  date: new Date().toISOString().split("T")[0],
                  description: "",
                  doctor: userData?.name || ""
                });
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {isAddingRecord ? "Close Panel" : "➕ Add Record"}
            </button>
          </div>

          {isAddingRecord && (
            <form onSubmit={handleAddOrUpdateRecord} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 text-xs">
              <h3 className="font-bold text-slate-300">{editingRecordId ? "✏️ Edit Medical Record" : "➕ Add Medical Record"}</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Record Type</label>
                  <select
                    name="type"
                    value={recordForm.type}
                    onChange={handleRecordFormChange}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                  >
                    <option value="Diagnosis">Diagnosis</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="Scan/X-Ray">Scan/X-Ray</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Record Title / Medication</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Amoxicillin 250mg or Brain MRI"
                    value={recordForm.title}
                    onChange={handleRecordFormChange}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    required
                    value={recordForm.date}
                    onChange={handleRecordFormChange}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Findings / Dosage Instructions / Description</label>
                <textarea
                  name="description"
                  required
                  placeholder="Enter detailed clinical findings or prescription dosage schedule..."
                  value={recordForm.description}
                  onChange={handleRecordFormChange}
                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white h-20 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition"
              >
                {editingRecordId ? "Update Record" : "Save Record"}
              </button>
            </form>
          )}

          <div className="space-y-4">
            {medicalRecords.map((rec) => (
              <div key={rec.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600/10 text-blue-400 border border-blue-600/20">
                      {rec.type}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-100 mt-2">{rec.title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Date: {rec.date} • Attending: {rec.doctor}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRecord(rec)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 border-t border-slate-900 pt-2 leading-relaxed whitespace-pre-line">
                  {rec.description}
                </p>
              </div>
            ))}

            {medicalRecords.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-8">No clinical medical records filed for this patient.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold border-b border-slate-850 pb-2">Incidents & Health Timeline</h2>
          
          <div className="relative border-l border-slate-800 ml-4 space-y-6">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative pl-6">
                <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${
                  evt.type === "admission" ? "bg-green-500" :
                  evt.type === "alert" ? "bg-red-500 animate-pulse" :
                  evt.type === "vital" ? "bg-cyan-500" :
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

      {/* Tab 4: Behavior/Activity */}
      {activeTab === "activity" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold border-b border-slate-850 pb-2">Camera Activity Log</h2>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {patientActivities.map((log) => (
              <div key={log.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-200">Activity: {log.activity}</p>
                  <p className="text-slate-400">
                    Recorded: {formatDateTime(log.timestamp)} • Confidence: {log.confidence || "--"}
                  </p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                  log.activity === "Fall Detected" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                  log.activity === "Inactivity Warning" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
                  "text-green-400 bg-green-500/10 border-green-500/20"
                }`}>
                  {log.activity === "Fall Detected" ? "Critical" : "Normal"}
                </span>
              </div>
            ))}

            {patientActivities.length === 0 && (
              <p className="text-slate-500 text-xs py-8 text-center">No camera activity logs recorded for this patient.</p>
            )}
          </div>
        </div>
      )}

      {/* Vitals history chart */}
      {vitalsHistory.length > 0 && activeTab === "details" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold border-b border-slate-850 pb-2">📉 Vitals Scan Graph</h3>
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

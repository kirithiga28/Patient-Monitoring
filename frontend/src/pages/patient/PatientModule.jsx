import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { clinicalService } from "../../services/clinicalService";
import { patientService } from "../../services/patientService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import { ChartCard } from "../../components/ui/ChartCard";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

// 1. Patient Profile (Standalone detail view)
export function PatientProfile({ patientId: propPatientId, onBack }) {
  const { role, hospitalId, userData } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback default patient in case none matches
  const defaultPatient = {
    id: "p_default",
    name: "Aarav Sharma",
    age: 8,
    bloodGroup: "O+",
    room: "101",
    diagnosis: "Epilepsy",
    status: "Stable",
    doctor: "Dr. Rajesh Mehta",
    contact: "9876543210",
    history: "Frequent seizure monitoring",
    vitals: { heartRate: 72, temperature: 98.6, bloodPressure: "120/80", oxygenSaturation: 98 }
  };

  useEffect(() => {
    async function loadPatient() {
      try {
        const id = propPatientId || "1";
        const p = await patientService.getPatient(id);
        setPatient(p);
      } catch (err) {
        setPatient(defaultPatient);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [propPatientId]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading patient chart...</div>;
  }

  const p = patient || defaultPatient;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{p.name}</h1>
          <p className="text-slate-400 text-xs mt-1">Patient Profile • Room {p.room}</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition cursor-pointer">
            ◀ Back to List
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Clinical Chart Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div><span className="text-slate-500 font-bold block mb-1">AGE</span> {p.age} Years</div>
            <div><span className="text-slate-500 font-bold block mb-1">BLOOD GROUP</span> {p.bloodGroup}</div>
            <div><span className="text-slate-500 font-bold block mb-1">PRIMARY PHYSICIAN</span> {p.doctor}</div>
            <div><span className="text-slate-500 font-bold block mb-1">CONTACT PHONE</span> {p.contact}</div>
            <div className="sm:col-span-2"><span className="text-slate-500 font-bold block mb-1">ADMITTING DIAGNOSIS</span> {p.diagnosis}</div>
            <div className="sm:col-span-2"><span className="text-slate-500 font-bold block mb-1">MEDICAL HISTORY NOTES</span> {p.history}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Telemetry Vitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-red-400 font-bold">HEART RATE</span>
              <span className="text-white font-extrabold">{p.vitals?.heartRate || 75} bpm</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-cyan-400 font-bold">OXYGEN SATURATION</span>
              <span className="text-white font-extrabold">{p.vitals?.oxygenSaturation || 98} %</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-bold">BLOOD PRESSURE</span>
              <span className="text-white font-extrabold">{p.vitals?.bloodPressure || "120/80"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-400 font-bold">TEMPERATURE</span>
              <span className="text-white font-extrabold">{p.vitals?.temperature || 98.6} °F</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 2. Medical Records
export function MedicalRecords() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients(role, hospitalId, userData?.assignedPatients, userData?.assignedRooms, (list) => {
      setPatients(list);
      setLoading(false);
    });
  }, [role, hospitalId, userData]);

  const columns = [
    { key: "name", label: "Patient" },
    { key: "age", label: "Age" },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "history", label: "Medical History Profile", className: "text-slate-400 max-w-sm truncate" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Central Medical Records</h1>
        <p className="text-slate-400 text-xs mt-1">Inspect hospital patient medical history profile and clinical diagnosis sheets.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search patients..."
        loading={loading}
      />
    </div>
  );
}

// 3. Patient Vitals
export function PatientVitals() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients(role, hospitalId, userData?.assignedPatients, userData?.assignedRooms, (list) => {
      setPatients(list);
      setLoading(false);
    });
  }, [role, hospitalId, userData]);

  const columns = [
    { key: "name", label: "Patient" },
    { key: "room", label: "Room" },
    { key: "heartRate", label: "Heart Rate", render: (row) => <span className="text-red-400 font-mono font-bold">{row.vitals?.heartRate || 75} bpm</span> },
    { key: "oxygenSaturation", label: "Oxygen SpO2", render: (row) => <span className="text-cyan-400 font-mono font-bold">{row.vitals?.oxygenSaturation || 98} %</span> },
    { key: "bloodPressure", label: "Blood Pressure", render: (row) => <span className="text-slate-300 font-mono">{row.vitals?.bloodPressure || "120/80"}</span> },
    { key: "temperature", label: "Temperature", render: (row) => <span className="text-amber-400 font-mono">{row.vitals?.temperature || 98.6} °F</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Vitals Telemetry Center</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time vital signs trackers and sensor feeds from ward rooms.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search patients..."
        loading={loading}
      />
    </div>
  );
}

// 4. ICU Monitoring
export function ICUMonitoring() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients(role, hospitalId, userData?.assignedPatients, userData?.assignedRooms, (list) => {
      // Filter for critical patients or ICU rooms
      setPatients(list.filter(p => p.status === "Critical" || p.room === "101" || p.room === "105" || p.room === "110"));
      setLoading(false);
    });
  }, [role, hospitalId, userData]);

  const columns = [
    { key: "name", label: "Patient" },
    { key: "room", label: "ICU Bed Room" },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "heartRate", label: "HR", render: (row) => <span className="text-red-400 font-mono font-bold">{row.vitals?.heartRate || 75}</span> },
    { key: "oxygenSaturation", label: "SpO2", render: (row) => <span className="text-cyan-400 font-mono font-bold">{row.vitals?.oxygenSaturation || 98}%</span> },
    {
      key: "status",
      label: "Clinical Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-blue-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">ICU Central Telemetry</h1>
        <p className="text-slate-400 text-xs mt-1">ICU Division monitors displaying critical vitals and active alerts.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search ICU patients..."
        loading={loading}
      />
    </div>
  );
}

// 5. Observation Ward Monitor
export function ObservationWardMonitor() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients(role, hospitalId, userData?.assignedPatients, userData?.assignedRooms, (list) => {
      // Filter for stable or observation status
      setPatients(list.filter(p => p.status === "Observation" || p.status === "Stable"));
      setLoading(false);
    });
  }, [role, hospitalId, userData]);

  const columns = [
    { key: "name", label: "Patient" },
    { key: "room", label: "Ward Room" },
    { key: "diagnosis", label: "Diagnosis" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Stable" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Observation Ward Monitor</h1>
        <p className="text-slate-400 text-xs mt-1">Track patient stability indexes, rounding checklists, and ward statuses.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search patients..."
        loading={loading}
      />
    </div>
  );
}

// 6. Critical Patient Monitor
export function CriticalPatientMonitor() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients(role, hospitalId, userData?.assignedPatients, userData?.assignedRooms, (list) => {
      // Filter specifically for Critical patients
      setPatients(list.filter(p => p.status === "Critical" || (p.vitals?.oxygenSaturation && p.vitals?.oxygenSaturation < 95)));
      setLoading(false);
    });
  }, [role, hospitalId, userData]);

  const columns = [
    { key: "name", label: "Patient" },
    { key: "room", label: "Room Assigned" },
    { key: "diagnosis", label: "Critical Indication" },
    { key: "oxygenSaturation", label: "Oxygen SpO2", render: (row) => <span className="text-red-400 font-mono font-bold">{row.vitals?.oxygenSaturation || 98}%</span> },
    {
      key: "status",
      label: "Severity",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">
          CRITICAL
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span className="animate-ping text-red-500">🔴</span> Critical Patient Monitor
        </h1>
        <p className="text-slate-400 text-xs mt-1">Review patients currently flagged with critical vitals or high-risk telemetry alarms.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search critical patients..."
        loading={loading}
      />
    </div>
  );
}

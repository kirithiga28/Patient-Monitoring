import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { clinicalService } from "../../services/clinicalService";
import { patientService } from "../../services/patientService";
import { activityService } from "../../services/activityService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import WebcamStream from "../../components/WebcamStream";

// Patient Profile standalone view is routed directly to src/pages/PatientProfile.jsx

// 2. Medical Records
export function MedicalRecords() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients("doctor", hospitalId, null, null, (list) => {
      setPatients(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "name", label: "Patient" },
    { key: "age", label: "Age" },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "history", label: "Medical History Profile", className: "text-slate-400 max-w-sm truncate" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
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
    return patientService.listenPatients("doctor", hospitalId, null, null, (list) => {
      setPatients(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "name", label: "Patient" },
    { key: "room", label: "Room" },
    { key: "heartRate", label: "Heart Rate", render: (row) => <span className="text-red-400 font-mono font-bold">{row.vitals?.heartRate || 75} bpm</span> },
    { key: "oxygenSaturation", label: "Oxygen SpO2", render: (row) => <span className="text-cyan-400 font-mono font-bold">{row.vitals?.oxygenSaturation || 98} %</span> },
    { key: "bloodPressure", label: "Blood Pressure", render: (row) => <span className="text-slate-300 font-mono">{row.vitals?.bloodPressure || "120/80"}</span> },
    { key: "temperature", label: "Temperature", render: (row) => <span className="text-amber-400 font-mono">{row.vitals?.temperature || 98.6} °F</span> }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
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
  const { hospitalId } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  useEffect(() => {
    const unsubPatients = patientService.listenPatients("doctor", hospitalId, null, null, (list) => {
      const icuList = list.filter(p => p.status === "Critical" || p.room === "101" || p.room === "105" || p.room === "110");
      setPatients(icuList);
      if (icuList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(icuList[0].id);
      }
      setLoading(false);
    });

    return () => {
      unsubPatients();
    };
  }, [hospitalId, selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

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
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-blue-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">ICU Central Telemetry</h1>
        <p className="text-slate-400 text-xs mt-1">ICU Division monitors displaying critical vitals, emergency alerts, and live video feeds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DataTable
            columns={columns}
            data={patients}
            searchKey="name"
            searchPlaceholder="Search ICU patients..."
            loading={loading}
            emptyMessage="No ICU patients found."
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live ICU Camera Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patients.length > 0 ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Select Patient Feed</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs text-slate-200"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Room {p.room})</option>
                      ))}
                    </select>
                  </div>
                  {selectedPatient && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                      <WebcamStream
                        patientId={selectedPatient.id}
                        patientName={selectedPatient.name}
                        roomCode={selectedPatient.room}
                        hospitalId={hospitalId}
                        compact={true}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No active ICU patients.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 5. Observation Ward Monitor
export function ObservationWardMonitor() {
  const { hospitalId } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    const unsubPatients = patientService.listenPatients("doctor", hospitalId, null, null, (list) => {
      const obsList = list.filter(p => p.status === "Observation" || p.status === "Stable");
      setPatients(obsList);
      if (obsList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(obsList[0].id);
      }
      setLoading(false);
    });

    const unsubActivities = activityService.listenActivities("doctor", hospitalId, (logs) => {
      setActivityLogs(logs.slice(0, 8));
    });

    return () => {
      unsubPatients();
      unsubActivities();
    };
  }, [hospitalId, selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

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
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Observation Ward Monitor</h1>
        <p className="text-slate-400 text-xs mt-1">Track patient stability indexes, ward statuses, activity logs, and camera feeds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DataTable
            columns={columns}
            data={patients}
            searchKey="name"
            searchPlaceholder="Search patients..."
            loading={loading}
          />

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Observation Ward Activity Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {activityLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-white block">{log.patientName}</span>
                    <span className="text-slate-400">{log.activity}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}</span>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-4">No recent activity logged.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Observation Camera Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patients.length > 0 ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Select Patient Feed</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs text-slate-200"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Room {p.room})</option>
                      ))}
                    </select>
                  </div>
                  {selectedPatient && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                      <WebcamStream
                        patientId={selectedPatient.id}
                        patientName={selectedPatient.name}
                        roomCode={selectedPatient.room}
                        hospitalId={hospitalId}
                        compact={true}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No active observation patients.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 6. Critical Patient Monitor
export function CriticalPatientMonitor() {
  const { hospitalId } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  useEffect(() => {
    const unsubPatients = patientService.listenCriticalPatients(hospitalId, (list) => {
      setPatients(list);
      if (list.length > 0 && !selectedPatientId) {
        setSelectedPatientId(list[0].id || list[0].patientId);
      }
      setLoading(false);
    });

    return () => {
      unsubPatients();
    };
  }, [hospitalId, selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId || p.patientId === selectedPatientId);

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
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span className="animate-ping text-red-500">🔴</span> Critical Patient Monitor
        </h1>
        <p className="text-slate-400 text-xs mt-1">Review patients currently flagged with critical vitals or high-risk telemetry alarms alongside live video feeds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DataTable
            columns={columns}
            data={patients}
            searchKey="name"
            searchPlaceholder="Search critical patients..."
            loading={loading}
            emptyMessage="No Critical Patients Available"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Critical Telemetry Video Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patients.length > 0 ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Select Critical Feed</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs text-slate-200"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Room {p.room})</option>
                      ))}
                    </select>
                  </div>
                  {selectedPatient && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                      <WebcamStream
                        patientId={selectedPatient.id}
                        patientName={selectedPatient.name}
                        roomCode={selectedPatient.room}
                        hospitalId={hospitalId}
                        compact={true}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No active critical patients.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

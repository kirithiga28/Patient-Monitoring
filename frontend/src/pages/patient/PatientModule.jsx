import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { clinicalService } from "../../services/clinicalService";
import { patientService } from "../../services/patientService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import { ChartCard } from "../../components/ui/ChartCard";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

// Helper patient details modal or common card styling
const badgeColors = {
  Stable: "bg-green-500/10 text-green-400 border border-green-500/20",
  Critical: "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse",
  Observation: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
};

// 8. Patient Admission
export function PatientAdmission() {
  const { hospitalId } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return clinicalService.listenAdmissions(hospitalId, (list) => {
      setAdmissions(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "diagnosis", label: "Diagnosis Indicator" },
    { key: "room", label: "Ward Room" },
    { key: "date", label: "Admission Date" },
    { key: "insurance", label: "Coverage Partner" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Patient Admission Records</h1>
        <p className="text-slate-400 text-xs mt-1">Register new admissions, configure coverage, and allocate ward rooms.</p>
      </div>

      <DataTable
        columns={columns}
        data={admissions}
        searchKey="patientName"
        searchPlaceholder="Search admitted patients..."
        loading={loading}
      />
    </div>
  );
}

// 9. Patient Discharge
export function PatientDischarge() {
  const { hospitalId } = useAuth();
  const [discharges, setDischarges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return clinicalService.listenDischarges(hospitalId, (list) => {
      setDischarges(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "diagnosis", label: "Primary Diagnosis" },
    { key: "room", label: "Prior Room" },
    { key: "date", label: "Discharge Date" },
    { key: "doctor", label: "Discharging Doctor" },
    { key: "summary", label: "Discharge Summary Notes", className: "max-w-xs truncate text-slate-400 font-mono text-[10px]" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Clinical Discharges</h1>
        <p className="text-slate-400 text-xs mt-1">Audit clinical discharges, follow-up summaries, and patient discharge logs.</p>
      </div>

      <DataTable
        columns={columns}
        data={discharges}
        searchKey="patientName"
        searchPlaceholder="Search discharged patients..."
        loading={loading}
      />
    </div>
  );
}

// 10. Patient Transfer
export function PatientTransfer() {
  const { hospitalId } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return clinicalService.listenTransfers(hospitalId, (list) => {
      setTransfers(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "fromRoom", label: "Source Ward Room" },
    { key: "toRoom", label: "Target Destination" },
    { key: "reason", label: "Transfer Indication Notes" },
    { key: "date", label: "Transfer Date" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Patient Internal Transfers</h1>
        <p className="text-slate-400 text-xs mt-1">Track room reallocation, transfer requests, and telemetry bed handovers.</p>
      </div>

      <DataTable
        columns={columns}
        data={transfers}
        searchKey="patientName"
        searchPlaceholder="Search patient transfers..."
        loading={loading}
      />
    </div>
  );
}

// 11. Patient Medical History
export function PatientMedicalHistory() {
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
    { key: "name", label: "Patient Name" },
    { key: "age", label: "Age" },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "history", label: "Medical History Profile & Incident Triggers", className: "max-w-md text-slate-400 text-[10px]" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Patient Clinical Histories</h1>
        <p className="text-slate-400 text-xs mt-1">Review pre-existing medical charts, allergy profiles, and critical risk factors.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search patient name..."
        loading={loading}
      />
    </div>
  );
}

// 12. Patient Vitals Monitoring
export function PatientVitalsMonitoring() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients(role, hospitalId, userData?.assignedPatients, userData?.assignedRooms, (list) => {
      setPatients(list);
      setLoading(false);
    });
  }, [role, hospitalId, userData]);

  // Mock heart rate log values for chart
  const vitalsChartData = [
    { time: "08:00", hr: 72, spo2: 98 },
    { time: "09:00", hr: 75, spo2: 97 },
    { time: "10:00", hr: 88, spo2: 95 },
    { time: "11:00", hr: 82, spo2: 98 },
    { time: "12:00", hr: 78, spo2: 99 }
  ];

  const columns = [
    { key: "name", label: "Patient Name" },
    { key: "room", label: "Room Assigned" },
    {
      key: "heartRate",
      label: "Heart Rate",
      render: (row) => (
        <span className="font-mono font-bold text-red-400">{row.vitals?.heartRate || 75} bpm</span>
      )
    },
    {
      key: "oxygenSaturation",
      label: "SpO2 Oxygen",
      render: (row) => (
        <span className="font-mono font-bold text-cyan-400">{row.vitals?.oxygenSaturation || 98} %</span>
      )
    },
    {
      key: "bloodPressure",
      label: "Blood Pressure",
      render: (row) => (
        <span className="font-mono text-slate-300">{row.vitals?.bloodPressure || "120/80"}</span>
      )
    },
    {
      key: "temperature",
      label: "Temperature",
      render: (row) => (
        <span className="font-mono text-amber-400">{row.vitals?.temperature || 98.6} °F</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Vitals Telemetry Monitors</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time vital counters, SpO2 sensor streams, and alarm thresholds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={patients}
            searchKey="name"
            searchPlaceholder="Search patient vitals..."
            loading={loading}
          />
        </div>

        <ChartCard title="Selected Patient Vitals Trend (Last 4h)">
          <LineChart data={vitalsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
            <Line type="monotone" dataKey="hr" stroke="#ef4444" name="HR (bpm)" activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="spo2" stroke="#06b6d4" name="SpO2 (%)" />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}

// 13. Patient Prescriptions
export function PatientPrescriptions() {
  const { hospitalId } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return clinicalService.listenPrescriptions(hospitalId, (list) => {
      setPrescriptions(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "medication", label: "Medication Name", className: "font-black text-cyan-400" },
    { key: "dosage", label: "Dosage (Strength)" },
    { key: "frequency", label: "Frequency Details" },
    { key: "startDate", label: "Start Date" },
    { key: "doctor", label: "Prescribing Physician" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Medication Prescriptions</h1>
        <p className="text-slate-400 text-xs mt-1">Audit active clinical prescriptions, dosages, and nurse schedules.</p>
      </div>

      <DataTable
        columns={columns}
        data={prescriptions}
        searchKey="patientName"
        searchPlaceholder="Search prescriptions by patient name..."
        loading={loading}
      />
    </div>
  );
}

// 14. Patient Treatment Plan
export function PatientTreatmentPlan() {
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
    { key: "diagnosis", label: "Primary Diagnosis" },
    {
      key: "treatment",
      label: "Active Treatment Protocol",
      render: (row) => (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
          <span className="text-[10px] text-blue-400 font-extrabold uppercase block mb-1">Standard Nursing Protocol</span>
          <p className="text-[10px] text-slate-300 leading-normal">
            Continuous bed-exit camera monitoring. Regular checks every 2 hours. Keep head of bed elevated 30 degrees.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Clinical Treatment Programs</h1>
        <p className="text-slate-400 text-xs mt-1">Review recovery guidelines, nurse monitoring frequency, and rehab tracks.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search treatment plan..."
        loading={loading}
      />
    </div>
  );
}

// 15. Patient Lab Reports
export function PatientLabReports() {
  const { hospitalId } = useAuth();
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return clinicalService.listenLabReports(hospitalId, (list) => {
      setLabReports(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "testName", label: "Diagnostic Panel / Test" },
    { key: "date", label: "Test Date" },
    { key: "result", label: "Laboratory Findings Summary", className: "text-slate-400 text-[10px] font-mono" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Laboratory Diagnostics Panels</h1>
        <p className="text-slate-400 text-xs mt-1">Review chemistry reports, metabolic profiles, and CBC blood logs.</p>
      </div>

      <DataTable
        columns={columns}
        data={labReports}
        searchKey="patientName"
        searchPlaceholder="Search lab reports..."
        loading={loading}
      />
    </div>
  );
}

// 16. Patient Scan Reports
export function PatientScanReports() {
  const { hospitalId } = useAuth();
  const [scanReports, setScanReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return clinicalService.listenScanReports(hospitalId, (list) => {
      setScanReports(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient Name" },
    { key: "scanType", label: "Imaging Scan Modality", className: "font-bold text-slate-200" },
    { key: "date", label: "Scan Date" },
    { key: "findings", label: "Imaging Findings Summary", className: "text-slate-400 text-[10px] font-mono" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Imaging & Scan Reports</h1>
        <p className="text-slate-400 text-xs mt-1">Review MRI brain scans, abdominal CT scans, chest X-rays, and findings.</p>
      </div>

      <DataTable
        columns={columns}
        data={scanReports}
        searchKey="patientName"
        searchPlaceholder="Search scan reports..."
        loading={loading}
      />
    </div>
  );
}

// 17. Patient Emergency Profile
export function PatientEmergencyProfile() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return patientService.listenPatients(role, hospitalId, userData?.assignedPatients, userData?.assignedRooms, (list) => {
      setPatients(list);
      setLoading(false);
    });
  }, [role, hospitalId, userData]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Emergency Resuscitation Cards</h1>
        <p className="text-slate-400 text-xs mt-1">DNR instructions, blood groups, allergy codes, and immediate contact details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patients.map((p) => (
          <Card key={p.id} className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${badgeColors[p.status] || badgeColors.Stable}`}>
                {p.status}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">BLOOD GROUP</span>
                  <span className="font-extrabold text-white text-sm">{p.bloodGroup || "O+"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ALLERGY WARNINGS</span>
                  <span className="font-extrabold text-red-400">Penicillin Sensitive</span>
                </div>
              </div>
              <p><span className="text-slate-500 font-bold block mb-1">DNR / INTUBATION PROTOCOL</span> DO NOT RESUSCITATE (DNR) - Signed chart on file.</p>
              <p><span className="text-slate-500 font-bold block mb-1">PRIMARY KIN CONTACT PHONE</span> {p.contact || "N/A"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

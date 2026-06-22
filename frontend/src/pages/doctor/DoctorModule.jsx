import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { staffService } from "../../services/staffService";
import { patientService } from "../../services/patientService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";

// 18. Doctor Schedule
export function DoctorSchedule() {
  const { hospitalId } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return staffService.listenSchedules(hospitalId, (list) => {
      setSchedules(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "name", label: "Physician Name" },
    { key: "department", label: "Specialty / Unit" },
    { key: "day", label: "Working Days" },
    { key: "hours", label: "Schedule Hours" },
    {
      key: "status",
      label: "On-Call Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Physician Work Schedules</h1>
        <p className="text-slate-400 text-xs mt-1">Review physician rounding timetables, on-call assignments, and department shifts.</p>
      </div>

      <DataTable
        columns={columns}
        data={schedules}
        searchKey="name"
        searchPlaceholder="Search doctor schedules..."
        loading={loading}
      />
    </div>
  );
}

// 19. Doctor Appointments
export function DoctorAppointments() {
  const { hospitalId } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return staffService.listenAppointments(hospitalId, (list) => {
      setAppointments(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "doctorName", label: "Physician" },
    { key: "time", label: "Appointment Time Slot", className: "font-mono font-bold text-cyan-400" },
    { key: "reason", label: "Consultation Indication" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Outpatient Consultation Appointments</h1>
        <p className="text-slate-400 text-xs mt-1">Monitor scheduled consultations, reason logs, and status updates.</p>
      </div>

      <DataTable
        columns={columns}
        data={appointments}
        searchKey="patientName"
        searchPlaceholder="Search appointments by patient name..."
        loading={loading}
      />
    </div>
  );
}

// 20. Doctor Notes
export function DoctorNotes() {
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
    {
      key: "notes",
      label: "Clinical Round Notes",
      render: (row) => (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
            <span>DR. VIVEK KUMAR</span>
            <span>LAST ROUNDED: TODAY 08:30 AM</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-normal font-sans">
            Lobe edema stable. Seizure threshold verified. Keep standard dosage of Levetiracetam. Continue active telemetry fall warnings.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Physician Rounding Notes</h1>
        <p className="text-slate-400 text-xs mt-1">Review notes from daily physician rounds, clinical observations, and telemetry orders.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search rounds by patient name..."
        loading={loading}
      />
    </div>
  );
}

// 21. Doctor Consultation Records
export function DoctorConsultationRecords() {
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
    { key: "doctor", label: "Primary Physician" },
    {
      key: "consultation",
      label: "Cardiology / Neurology Consultation Files",
      render: (row) => (
        <div className="text-[11px] text-slate-400 font-mono">
          Case review finalized. Electroencephalogram (EEG) displays standard rhythm. Heart sounds normal. No acute warnings.
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Consultation Records</h1>
        <p className="text-slate-400 text-xs mt-1">Inspect case summaries, multi-disciplinary consultations, and diagnostic logs.</p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search consultations..."
        loading={loading}
      />
    </div>
  );
}

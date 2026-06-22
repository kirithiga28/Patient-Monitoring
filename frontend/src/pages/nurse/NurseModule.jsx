import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { staffService } from "../../services/staffService";
import { patientService } from "../../services/patientService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";

// 22. Nurse Assignment Board
export function NurseAssignmentBoard() {
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
    { key: "room", label: "Ward Room Code", className: "font-mono font-bold" },
    { key: "name", label: "Patient" },
    { key: "diagnosis", label: "Admitting Diagnosis" },
    {
      key: "nurse",
      label: "Assigned Nurse Staff",
      render: (row) => (
        <span className="font-bold text-slate-300">
          {row.room === "101" || row.room === "108" ? "Nurse Lisa Miller" : "Nurse Sarah Jenkins"}
        </span>
      )
    },
    {
      key: "careLevel",
      label: "Care Plan Level",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
          row.status === "Critical" ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" : "bg-green-500/10 text-green-400 border border-green-500/20"
        }`}>
          {row.status === "Critical" ? "High Observation" : "Standard"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Nurse Assignment Board</h1>
        <p className="text-slate-400 text-xs mt-1">Audit which patient beds and ward rooms are allocated to active nurse teams.</p>
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

// 23. Nurse Shift Management
export function NurseShiftManagement() {
  const { hospitalId } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return staffService.listenShifts(hospitalId, (list) => {
      setShifts(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "staffName", label: "Nurse Staff" },
    { key: "shiftType", label: "Shift Schedule Hours" },
    { key: "unit", label: "Ward / Unit Location" },
    { key: "date", label: "Date" },
    {
      key: "status",
      label: "Duty Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Checked In" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-slate-950 text-slate-400 border border-slate-850"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Nurse Shift Rosters</h1>
        <p className="text-slate-400 text-xs mt-1">Monitor working hours, duty status updates, and division check-ins.</p>
      </div>

      <DataTable
        columns={columns}
        data={shifts}
        searchKey="staffName"
        searchPlaceholder="Search staff shift..."
        loading={loading}
      />
    </div>
  );
}

// 24. Medication Administration Record
export function MedicationAdministrationRecord() {
  const { hospitalId } = useAuth();
  const [mar, setMar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return staffService.listenMAR(hospitalId, (list) => {
      setMar(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "medication", label: "Medication Name", className: "font-black text-cyan-400" },
    { key: "dosage", label: "Dosage" },
    { key: "route", label: "Route" },
    { key: "timeScheduled", label: "Scheduled Slot" },
    {
      key: "status",
      label: "Administration Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
          row.status === "Administered" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse"
        }`}>
          {row.status}
        </span>
      )
    },
    { key: "nurseName", label: "Signing Nurse Staff" },
    { key: "timeAdministered", label: "Signing Time", className: "font-mono text-[10px] text-slate-400" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Medication Administration Records (MAR)</h1>
        <p className="text-slate-400 text-xs mt-1">Legally sign, audit, and log medication administrations in real-time.</p>
      </div>

      <DataTable
        columns={columns}
        data={mar}
        searchKey="patientName"
        searchPlaceholder="Search patient record..."
        loading={loading}
      />
    </div>
  );
}

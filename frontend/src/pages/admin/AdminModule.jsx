import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import { staffService } from "../../services/staffService";
import { systemService } from "../../services/systemService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import { ChartCard } from "../../components/ui/ChartCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// 23. Bed Management
export function BedManagement() {
  const { hospitalId } = useAuth();
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return adminService.listenBeds(hospitalId, (list) => {
      setBeds(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "bedCode", label: "Bed Identifier" },
    { key: "roomNumber", label: "Room Assigned" },
    { key: "department", label: "Clinical Unit" },
    { key: "type", label: "Bed Model" },
    {
      key: "status",
      label: "Occupancy Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Occupied" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Bed Inventory Manager</h1>
        <p className="text-slate-400 text-xs mt-1">Configure specific electronic telemetry beds models and check availabilities.</p>
      </div>

      <DataTable
        columns={columns}
        data={beds}
        searchKey="bedCode"
        searchPlaceholder="Search by bed code..."
        loading={loading}
      />
    </div>
  );
}

// 24. Staff Management (Consolidated Shift rosters and Duty assignments)
export function StaffManagement() {
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
    { key: "staffName", label: "Clinical Staff" },
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Clinical Staff & Duty Roster</h1>
        <p className="text-slate-400 text-xs mt-1">Monitor working hours, duty status updates, and division shift schedules.</p>
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

// 25. User Management
export function UserManagement() {
  const { hospitalId } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return adminService.listenUsers(hospitalId, (list) => {
      setUsers(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "name", label: "Full Name" },
    { key: "email", label: "Email Address" },
    { key: "role", label: "Staff Role", className: "uppercase font-bold text-slate-400 text-[10px]" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Staff User Accounts</h1>
        <p className="text-slate-400 text-xs mt-1">Manage, register, and audit credentials of clinical doctors, nurses, and admins.</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search staff name..."
        loading={loading}
      />
    </div>
  );
}

// 26. Device Management
export function DeviceManagement() {
  const { hospitalId } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to API configs which represent service integration devices
    return systemService.listenApiConfigs(hospitalId, (list) => {
      setDevices(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "serviceName", label: "Telemetry Equipment / Device" },
    { key: "endpoint", label: "Device Host IP / Endpoint", className: "font-mono text-purple-400 text-[10px]" },
    {
      key: "status",
      label: "Device Status",
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Ward Devices Registry</h1>
        <p className="text-slate-400 text-xs mt-1">Configure active telemetry controllers, camera processors, and data integrations.</p>
      </div>

      <DataTable
        columns={columns}
        data={devices}
        searchKey="serviceName"
        searchPlaceholder="Search service name..."
        loading={loading}
      />
    </div>
  );
}

// 27. Analytics Dashboard
export function AnalyticsDashboard() {
  const chartData = [
    { name: "Mon", rate: 68 },
    { name: "Tue", rate: 72 },
    { name: "Wed", rate: 85 },
    { name: "Thu", rate: 80 },
    { name: "Fri", rate: 90 },
    { name: "Sat", rate: 78 },
    { name: "Sun", rate: 82 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Hospital Operations Analytics</h1>
        <p className="text-slate-400 text-xs mt-1">Global occupancy curves, recovery timeline trends, and AI accuracy matrices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Weekly Occupancy Index" value="82.4%" icon="📊" color="purple" />
        <StatCard title="Mean Recovery Duration" value="10.8 Days" icon="📈" color="blue" />
        <StatCard title="AI Accuracy Index" value="97.8%" icon="🤖" color="green" />
      </div>

      <ChartCard title="Weekly Occupancy Trend (%)">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
          <Area type="monotone" dataKey="rate" stroke="#3b82f6" fillOpacity={0.15} fill="url(#colorRate)" />
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ChartCard>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";
import { ChartCard } from "../../components/ui/ChartCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// 1. Admin Dashboard
export function AdminDashboard() {
  const { hospitalId } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubD = adminService.listenDepartments(hospitalId, (list) => setDepartments(list));
    const unsubR = adminService.listenRooms(hospitalId, (list) => setRooms(list));
    const unsubB = adminService.listenBeds(hospitalId, (list) => setBeds(list));
    const unsubU = adminService.listenUsers(hospitalId, (list) => {
      setUsers(list);
      setLoading(false);
    });
    return () => {
      unsubD();
      unsubR();
      unsubB();
      unsubU();
    };
  }, [hospitalId]);

  const stats = [
    { title: "Active Departments", value: departments.length, icon: "🏢", color: "blue" },
    { title: "Total Ward Rooms", value: rooms.length, icon: "🚪", color: "purple" },
    { title: "Telemetry Beds", value: beds.length, icon: "🛏️", color: "cyan" },
    { title: "Registered Staff", value: users.length, icon: "👥", color: "green" },
  ];

  // Chart Mock Data: Occupancy trend
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
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Hospital Admin Dashboard
        </h1>
        <p className="text-slate-400 text-xs mt-1">High-level operational stats, room counts, and clinic occupancy metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Weekly Occupancy Trend (%)" className="lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Department Operational Capacities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments.map((d) => (
              <div key={d.id} className="flex justify-between items-center bg-slate-950 border border-slate-850 p-3 rounded-xl">
                <div>
                  <span className="font-bold text-white text-xs block">{d.name}</span>
                  <span className="text-[10px] text-slate-500">Head: {d.head}</span>
                </div>
                <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  {d.beds} Beds
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 2. Hospital Management
export function HospitalManagement() {
  const { hospitalId } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return adminService.listenHospitals(hospitalId, (list) => {
      setHospitals(list);
      setLoading(false);
    });
  }, [hospitalId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Hospital Configuration</h1>
        <p className="text-slate-400 text-xs mt-1">Configure active clinic tenants, address profiles, and registry identifiers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hospitals.map((h) => (
          <Card key={h.id}>
            <CardHeader>
              <CardTitle>{h.name}</CardTitle>
              <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full font-bold">
                {h.status}
              </span>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p><span className="text-slate-500 font-bold block mb-1">REGISTRY ID</span> {h.id}</p>
              <p><span className="text-slate-500 font-bold block mb-1">CLINIC ADDRESS</span> {h.address}</p>
              <p><span className="text-slate-500 font-bold block mb-1">TELEPHONE HOTLINE</span> {h.phone}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 3. Department Management
export function DepartmentManagement() {
  const { hospitalId } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return adminService.listenDepartments(hospitalId, (list) => {
      setDepartments(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "name", label: "Department Name" },
    { key: "code", label: "Department Code" },
    { key: "head", label: "Medical Director" },
    { key: "beds", label: "Allotted Beds" },
    {
      key: "status",
      label: "Operational Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Operational" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Department Registry</h1>
        <p className="text-slate-400 text-xs mt-1">Add, update, or inspect operational clinical units in this clinic.</p>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        searchKey="name"
        searchPlaceholder="Search departments..."
        loading={loading}
      />
    </div>
  );
}

// 4. Room Management
export function RoomManagement() {
  const { hospitalId } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return adminService.listenRooms(hospitalId, (list) => {
      setRooms(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "roomNumber", label: "Room Code / Number" },
    { key: "department", label: "Clinical Department" },
    { key: "type", label: "Room Classification" },
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Ward Room Management</h1>
        <p className="text-slate-400 text-xs mt-1">Configure isolation chambers, standard rooms, and ICU beds configurations.</p>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        searchKey="roomNumber"
        searchPlaceholder="Search by room code..."
        loading={loading}
      />
    </div>
  );
}

// 5. Bed Management
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

// 6. User Management
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

// 7. Role Permission Management
export function RolePermissionManagement() {
  const { hospitalId } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return adminService.listenPermissions(hospitalId, (list) => {
      setPermissions(list);
      setLoading(false);
    });
  }, [hospitalId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Role Permission Matrix</h1>
        <p className="text-slate-400 text-xs mt-1">Configure clinical system module permissions for hospital roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {permissions.map((p) => (
          <Card key={p.id} className="border-t-4 border-t-purple-500">
            <CardHeader>
              <CardTitle className="uppercase tracking-widest text-slate-200 text-xs">{p.role}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {Object.keys(p.modules || {}).map((m) => (
                <div key={m} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <span className="capitalize font-bold text-slate-400">{m} Module</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    p.modules[m] ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {p.modules[m] ? "Granted" : "Denied"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

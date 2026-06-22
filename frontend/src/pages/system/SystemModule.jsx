import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { systemService } from "../../services/systemService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";

// 28. Audit Logs
export function AuditLogs() {
  const { hospitalId } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return systemService.listenAuditLogs(hospitalId, (list) => {
      setLogs(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "user", label: "User / Account" },
    { key: "action", label: "Action Description", className: "font-bold text-slate-200" },
    { key: "timestamp", label: "Timestamp", className: "font-mono text-slate-400" },
    { key: "ipAddress", label: "Client IP Address", className: "font-mono text-slate-500" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Clinical Audit Logs</h1>
        <p className="text-slate-400 text-xs mt-1">Audit security trails, database reads, clinical modifications, and access IPs.</p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchKey="user"
        searchPlaceholder="Search by user email..."
        loading={loading}
      />
    </div>
  );
}

// 29. System Overview
export function SystemOverview() {
  const { hospitalId } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return systemService.listenBackups(hospitalId, (list) => {
      setBackups(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "filename", label: "Backup Archive File", className: "font-mono font-bold text-cyan-400" },
    { key: "size", label: "Size" },
    { key: "date", label: "Completion Time" },
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Service Overview</h1>
        <p className="text-slate-400 text-xs mt-1">Configure automated SQL archives, database connections, and system uptimes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Database Status" value="Active (Connected)" icon="💾" color="green" />
        <StatCard title="Render AI service Status" value="Active (ONLINE)" icon="🔌" color="blue" />
        <StatCard title="System Uptime Index" value="99.98%" icon="⏰" color="cyan" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database SQL Backup Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={backups}
            searchKey="filename"
            searchPlaceholder="Search backup logs..."
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

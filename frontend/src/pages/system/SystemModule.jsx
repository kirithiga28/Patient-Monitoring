import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { systemService } from "../../services/systemService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable } from "../../components/ui/DataTable";

// 41. Audit Logs
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

// 42. Backup & Recovery
export function BackupRecovery() {
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
    { key: "filename", label: "Backup Filename", className: "font-mono font-bold text-cyan-400" },
    { key: "size", label: "Size" },
    { key: "type", label: "Backup Type" },
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Database Backup & Recovery</h1>
        <p className="text-slate-400 text-xs mt-1">Audit automated weekly archives, file sizes, and download SQL backups.</p>
      </div>

      <DataTable
        columns={columns}
        data={backups}
        searchKey="filename"
        searchPlaceholder="Search backup files..."
        loading={loading}
      />
    </div>
  );
}

// 43. API Configuration
export function ApiConfiguration() {
  const { hospitalId } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return systemService.listenApiConfigs(hospitalId, (list) => {
      setConfigs(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "serviceName", label: "API Integrations Service" },
    { key: "endpoint", label: "Endpoint Address", className: "font-mono text-purple-400 text-[10px]" },
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
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System API Credentials</h1>
        <p className="text-slate-400 text-xs mt-1">Configure active endpoints for Render AI microservices and Firebase integrations.</p>
      </div>

      <DataTable
        columns={columns}
        data={configs}
        searchKey="serviceName"
        searchPlaceholder="Search api endpoints..."
        loading={loading}
      />
    </div>
  );
}

// 44. Security Monitoring
export function SecurityMonitoring() {
  const { hospitalId } = useAuth();
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return systemService.listenSecurityLogs(hospitalId, (list) => {
      setSecurityLogs(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "event", label: "Security Event Alert", className: "font-bold text-red-400 animate-pulse" },
    { key: "details", label: "Event Audit Details", className: "max-w-xs truncate" },
    { key: "severity", label: "Severity Grade" },
    { key: "timestamp", label: "Detection Time" },
    { key: "actionTaken", label: "Automatic Action Taken", className: "text-slate-400 text-[10px]" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Network & Security Monitoring</h1>
        <p className="text-slate-400 text-xs mt-1">Monitor firewall security notifications, automatic IP blocking, and system updates.</p>
      </div>

      <DataTable
        columns={columns}
        data={securityLogs}
        searchKey="event"
        searchPlaceholder="Search security event logs..."
        loading={loading}
      />
    </div>
  );
}

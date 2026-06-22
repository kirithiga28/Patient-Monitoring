import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { ChartCard } from "../../components/ui/ChartCard";
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

// Mock data datasets
const recoveryData = [
  { month: "Jan", recoveryTimeDays: 14, successRate: 92 },
  { month: "Feb", recoveryTimeDays: 13, successRate: 94 },
  { month: "Mar", recoveryTimeDays: 12, successRate: 95 },
  { month: "Apr", recoveryTimeDays: 11, successRate: 97 },
  { month: "May", recoveryTimeDays: 10, successRate: 98 }
];

const accuracyData = [
  { day: "Mon", accuracy: 96.8, falsePositive: 2.1 },
  { day: "Tue", accuracy: 97.4, falsePositive: 1.8 },
  { day: "Wed", accuracy: 98.2, falsePositive: 1.2 },
  { day: "Thu", accuracy: 97.9, falsePositive: 1.5 },
  { day: "Fri", accuracy: 98.5, falsePositive: 0.9 }
];

const occupancyData = [
  { dept: "Neurology", rate: 85 },
  { dept: "Cardiology", rate: 72 },
  { dept: "ICU", rate: 90 },
  { dept: "Orthopedics", rate: 64 },
  { dept: "General Ward", rate: 78 }
];

// 34. Hospital Analytics Dashboard
export function HospitalAnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Hospital Operations Analytics</h1>
        <p className="text-slate-400 text-xs mt-1">Review recovery success, clinic occupancies, and AI accuracy metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Average Bed Recovery Time" value="11.4 Days" icon="📈" color="blue" />
        <StatCard title="Global Occupancy Rate" value="77.8%" icon="🛏️" color="purple" />
        <StatCard title="Pose Model Accuracy Rate" value="97.8%" icon="🤖" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Clinical Recovery success & Time trends">
          <LineChart data={recoveryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
            <Legend />
            <Line type="monotone" dataKey="successRate" stroke="#10b981" name="Success Rate (%)" />
            <Line type="monotone" dataKey="recoveryTimeDays" stroke="#3b82f6" name="Recovery Days" />
          </LineChart>
        </ChartCard>

        <ChartCard title="AI Accuracy & Error Rate Trends">
          <LineChart data={accuracyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
            <Legend />
            <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" name="Accuracy (%)" />
            <Line type="monotone" dataKey="falsePositive" stroke="#ef4444" name="False Alarm Rate (%)" />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}

// 35. Occupancy Analytics
export function OccupancyAnalytics() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Department Occupancy Analytics</h1>
        <p className="text-slate-400 text-xs mt-1">Audit active bed capacities, vacancy rates, and admission velocity indexes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Department Occupancy Rate (%)" className="lg:col-span-2">
          <BarChart data={occupancyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="dept" stroke="#64748b" style={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
            <Bar dataKey="rate" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Operational Beds</span>
              <span className="font-bold text-white">65</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Beds Occupied</span>
              <span className="font-bold text-red-400">51 Beds</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Beds Vacant</span>
              <span className="font-bold text-green-400">14 Beds</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 36. Patient Recovery Analytics
export function PatientRecoveryAnalytics() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Patient Recovery Analytics</h1>
        <p className="text-slate-400 text-xs mt-1">Review average discharge times, rehabilitation metrics, and success rates.</p>
      </div>

      <ChartCard title="Discharge Success & Recovery Time Trend (Months)">
        <LineChart data={recoveryData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
          <Legend />
          <Line type="monotone" dataKey="successRate" stroke="#10b981" name="Success Rate (%)" activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="recoveryTimeDays" stroke="#06b6d4" name="Average Recovery Days" />
        </LineChart>
      </ChartCard>
    </div>
  );
}

// 37. AI Accuracy Dashboard
export function AIAccuracyDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">AI Model Accuracy Analytics</h1>
        <p className="text-slate-400 text-xs mt-1">Review pose model accuracy percentages, false alarm alerts, and validation details.</p>
      </div>

      <ChartCard title="AI Pose Verification Accuracy Trend (Daily)">
        <LineChart data={accuracyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
          <Legend />
          <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy Rate (%)" activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="falsePositive" stroke="#ef4444" name="False Alarm Rate (%)" />
        </LineChart>
      </ChartCard>
    </div>
  );
}

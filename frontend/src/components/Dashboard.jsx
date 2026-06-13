import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "patients"),
      (snapshot) => {
        const patientList = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setPatients(patientList);
      }
    );

    return () => unsubscribe();
  }, []);

  const totalPatients = patients.length;

  const criticalPatients = patients.filter(
    (p) => p.status === "Critical"
  ).length;

  const observationPatients = patients.filter(
    (p) => p.status === "Observation"
  ).length;

  const stablePatients = patients.filter(
    (p) => p.status === "Stable"
  ).length;

  const chartData = [
    {
      name: "Stable",
      patients: stablePatients,
    },
    {
      name: "Observation",
      patients: observationPatients,
    },
    {
      name: "Critical",
      patients: criticalPatients,
    },
  ];

  const monitoringRooms = [
    {
      room: "101",
      patient: "Aarav Sharma",
      activity: "Sleeping",
      confidence: "98%",
      status: "Normal",
    },
    {
      room: "105",
      patient: "Priya Nair",
      activity: "Fall Detected",
      confidence: "96%",
      status: "Critical",
    },
    {
      room: "108",
      patient: "Rohan Verma",
      activity: "Walking",
      confidence: "94%",
      status: "Normal",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-blue-600 font-semibold">
            Well Care Hospital
          </p>

          <h1 className="text-3xl font-bold">
            AI Patient Monitoring Dashboard
          </h1>

          <p className="text-gray-500">
            {new Date().toLocaleString()}
          </p>
        </div>

        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold">
          🔔 {criticalPatients} Active Alerts
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">
            Total Patients
          </h3>

          <p className="text-3xl font-bold text-blue-600">
            {totalPatients}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">
            Critical Patients
          </h3>

          <p className="text-3xl font-bold text-red-600">
            {criticalPatients}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">
            Observation Patients
          </h3>

          <p className="text-3xl font-bold text-yellow-600">
            {observationPatients}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">
            Stable Patients
          </h3>

          <p className="text-3xl font-bold text-green-600">
            {stablePatients}
          </p>
        </div>
      </div>

      {/* Live Monitoring */}
      <h2 className="text-2xl font-bold mb-4">
        📹 Live Monitoring
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {monitoringRooms.map((room, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl shadow"
          >
            <div className="bg-slate-200 h-40 rounded-lg flex flex-col items-center justify-center mb-4">
              <p className="text-3xl">📹</p>

              <p className="font-bold">
                Camera Active
              </p>

              <p className="text-red-600 font-bold">
                ● LIVE
              </p>
            </div>

            <h3 className="font-bold text-xl">
              Room {room.room}
            </h3>

            <p>
              <strong>Patient:</strong>{" "}
              {room.patient}
            </p>

            <p>
              <strong>Activity:</strong>{" "}
              {room.activity}
            </p>

            <p>
              <strong>AI Confidence:</strong>{" "}
              {room.confidence}
            </p>

            <p
              className={`font-bold ${
                room.status === "Critical"
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {room.status}
            </p>
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">
          📊 Patient Status Analytics
        </h2>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="patients"
              fill="#2563eb"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Activity Detection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          🧠 AI Activity Detection
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-bold text-lg">
              Room 101
            </h3>

            <p>
              <strong>
                Current Activity:
              </strong>{" "}
              Sleeping
            </p>

            <p>
              <strong>Confidence:</strong>{" "}
              98%
            </p>

            <p className="text-green-600 font-bold">
              Risk Level: Low
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-bold text-lg">
              Room 105
            </h3>

            <p>
              <strong>
                Current Activity:
              </strong>{" "}
              Fall Detected
            </p>

            <p>
              <strong>Confidence:</strong>{" "}
              96%
            </p>

            <p className="text-red-600 font-bold">
              Risk Level: High
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-bold text-lg">
              Room 108
            </h3>

            <p>
              <strong>
                Current Activity:
              </strong>{" "}
              Walking
            </p>

            <p>
              <strong>Confidence:</strong>{" "}
              94%
            </p>

            <p className="text-yellow-600 font-bold">
              Risk Level: Medium
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center text-gray-500 text-sm">
        Well Care Hospital © 2026
        <br />
        AI-Based Real-Time Abnormal Human Activity
        Detection System
      </div>
    </div>
  );
}
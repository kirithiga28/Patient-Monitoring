import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const monitoringRooms = [
    {
      room: "101",
      patient: "Aarav Sharma",
      activity: "Sleeping",
      confidence: "98%",
      status: "Normal"
    },
    {
      room: "105",
      patient: "Priya Nair",
      activity: "Fall Detected",
      confidence: "96%",
      status: "Critical"
    },
    {
      room: "108",
      patient: "Rohan Verma",
      activity: "Walking",
      confidence: "94%",
      status: "Normal"
    }
  ];

  const chartData = [
    { name: "Stable", patients: 4 },
    { name: "Observation", patients: 3 },
    { name: "Critical", patients: 3 }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          AI Patient Monitoring Dashboard
        </h1>

        <div className="bg-red-100 px-4 py-2 rounded-lg font-semibold">
          🔔 4 Alerts
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Total Patients</h3>
          <p className="text-3xl font-bold text-blue-600">10</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Critical Patients</h3>
          <p className="text-3xl font-bold text-red-600">3</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Active Alerts</h3>
          <p className="text-3xl font-bold text-yellow-600">4</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Monitoring Cameras</h3>
          <p className="text-3xl font-bold text-green-600">10</p>
        </div>
      </div>

      {/* Live Monitoring */}
      <h2 className="text-2xl font-bold mb-4">
        Live Monitoring
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {monitoringRooms.map((room, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl shadow"
          >
            <div className="bg-slate-200 h-40 rounded-lg flex flex-col items-center justify-center mb-4">
              <p className="text-2xl">📹</p>
              <p className="font-bold">Camera Active</p>
              <p className="text-red-600 font-bold">
                ● LIVE
              </p>
            </div>

            <h3 className="font-bold text-xl">
              Room {room.room}
            </h3>

            <p>
              <strong>Patient:</strong> {room.patient}
            </p>

            <p>
              <strong>Activity:</strong> {room.activity}
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

      {/* Analytics Chart */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Patient Status Analytics
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="patients" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
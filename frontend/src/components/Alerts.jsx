import { useEffect, useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState([
    {
      time: "02:15 PM",
      message: "Fall detected in Room 105"
    }
  ]);

  useEffect(() => {
    const alertPool = [
      "Fall detected in Room 105",
      "Patient distress detected in Room 108",
      "Abnormal inactivity detected in Room 122",
      "Patient left bed unexpectedly in Room 115",
      "Sudden movement detected in Room 101"
    ];

    const interval = setInterval(() => {
      const newAlert = {
        time: new Date().toLocaleTimeString(),
        message:
          alertPool[
            Math.floor(Math.random() * alertPool.length)
          ]
      };

      setAlerts((prev) => [newAlert, ...prev]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        AI Alert Center
      </h1>

      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="bg-red-100 border-l-4 border-red-500 p-5 rounded-xl"
          >
            <p className="font-bold text-red-700">
              ⚠ {alert.message}
            </p>

            <p className="text-gray-600">
              {alert.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
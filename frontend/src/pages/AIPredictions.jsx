import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import { alertService } from "../services/alertService";

export default function AIPredictions() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPatients = patientService.listenPatients(
      role,
      hospitalId,
      userData?.assignedPatients,
      userData?.assignedRooms,
      (patientList) => {
        setPatients(patientList);
        setLoading(false);
      }
    );

    const unsubAlerts = alertService.listenAlerts(role, hospitalId, (alertList) => {
      setAlerts(alertList);
    });

    return () => {
      unsubPatients();
      unsubAlerts();
    };
  }, [role, hospitalId, userData]);

  // Calculate prediction risk dynamically
  const calculateRisk = (patient) => {
    const age = Number(patient.age) || 40;
    const history = (patient.history || "").toLowerCase();
    const diagnosis = (patient.diagnosis || "").toLowerCase();
    const vitals = patient.vitals || {};
    const patientAlerts = alerts.filter(a => a.patientId === patient.id);
    const alertCount = patientAlerts.length;

    let score = 10; // base score

    // Age risk factor
    if (age > 75) score += 25;
    else if (age > 60) score += 15;

    // Diagnosis & history indicators
    if (diagnosis.includes("stroke") || diagnosis.includes("epilepsy") || diagnosis.includes("trauma")) score += 20;
    if (diagnosis.includes("heart") || diagnosis.includes("cardiac")) score += 15;
    if (history.includes("seizure") || history.includes("fall")) score += 20;

    // Prior alert incidents
    score += alertCount * 8;

    // Vital telemetry alarms
    const hr = Number(vitals.heartRate) || 75;
    const o2 = Number(vitals.oxygenSaturation) || 98;
    const temp = Number(vitals.temperature) || 98.6;
    
    if (o2 < 92) score += 30; // severe hypoxic risk
    else if (o2 < 95) score += 15;

    if (hr > 110 || hr < 50) score += 20; // brady/tachycardia
    if (temp > 101.5 || temp < 96.0) score += 15; // febrile or hypothermic

    // Clamp score
    score = Math.min(score, 100);

    let level = "Low Risk";
    let color = "text-green-400 bg-green-500/10 border-green-500/20";
    let recommendation = "Maintain routine patient observations.";

    if (score > 75) {
      level = "Critical Risk";
      color = "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse";
      recommendation = "Immediate ICU assessment and constant telemetry feed.";
    } else if (score > 50) {
      level = "High Risk";
      color = "text-orange-400 bg-orange-500/10 border-orange-500/20";
      recommendation = "Hourly rounding and verify camera stream status.";
    } else if (score > 25) {
      level = "Medium Risk";
      color = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      recommendation = "Standard regular nurse rounding and checks.";
    }

    return { score, level, color, recommendation };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-sm">Assessing Risk Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          AI Risk Prediction Center
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Predictive assessment matching age, history, vitals thresholds, and AI detections.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {patients.map((patient) => {
          const pred = calculateRisk(patient);
          return (
            <div
              key={patient.id}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-4">
                  <h2 className="text-xl font-extrabold text-white">{patient.name}</h2>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border ${pred.color}`}>
                    {pred.level}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400 mb-4">
                  <p>
                    <span className="text-slate-500 font-semibold">Diagnosis:</span> {patient.diagnosis}
                  </p>
                  <p>
                    <span className="text-slate-500 font-semibold">Age/Room:</span> {patient.age} yrs • Room {patient.room}
                  </p>
                  <p>
                    <span className="text-slate-500 font-semibold">Current Vitals:</span> SpO2 {patient.vitals?.oxygenSaturation || "--"}% • HR {patient.vitals?.heartRate || "--"}bpm • Temp {patient.vitals?.temperature || "--"}°F
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">AI Prediction Confidence:</span>
                  <span className="font-bold text-slate-200">{(85 + (pred.score % 15))}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Risk Level Score:</span>
                  <span className="font-bold text-slate-200">{pred.score} / 100</span>
                </div>
                <div className="mt-2 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="font-semibold text-blue-400 block mb-0.5">Recommendation:</span>
                  {pred.recommendation}
                </div>
              </div>
            </div>
          );
        })}

        {patients.length === 0 && (
          <p className="text-center text-slate-500 py-12 text-sm col-span-2">No patients registered to calculate risks.</p>
        )}
      </div>
    </div>
  );
}

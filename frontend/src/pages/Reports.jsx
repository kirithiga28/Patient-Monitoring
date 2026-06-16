import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import { alertService } from "../services/alertService";
import { jsPDF } from "jspdf";
import { formatDateTime } from "../utils/dateFormatter";

export default function Reports() {
  const { role, hospitalId, userData } = useAuth();
  const [reportType, setReportType] = useState("patients");
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

  // Excel (CSV) Download
  const downloadExcel = () => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (reportType === "patients") {
      filename = "Patient_Report.csv";
      headers = ["ID", "Name", "Age", "Blood Group", "Room", "Diagnosis", "Status", "Doctor", "Contact"];
      rows = patients.map((p) => [
        p.id,
        p.name || "",
        p.age || "",
        p.bloodGroup || "",
        p.room || "",
        p.diagnosis || "",
        p.status || "",
        p.doctor || "",
        p.contact || ""
      ]);
    } else if (reportType === "alerts") {
      filename = "Alert_Report.csv";
      headers = ["ID", "Patient Name", "Room", "Alert Type", "Severity", "Status", "Timestamp", "Resolved By", "Notes"];
      rows = alerts.map((a) => [
        a.id,
        a.patientName || "",
        a.room || "",
        a.alertType || "",
        a.severity || "",
        a.status || "",
        formatDateTime(a.timestamp),
        a.resolvedBy || "",
        a.notes || ""
      ]);
    } else {
      filename = "AI_Detection_Report.csv";
      headers = ["ID", "Patient Name", "Room", "Detected Activity", "Confidence Score", "Risk Evaluation", "Timestamp"];
      // Maps alerts representing AI Detections
      rows = alerts.map((a) => [
        a.id,
        a.patientName || "",
        a.room || "",
        a.alertType || "",
        "95%", // default confidence
        a.severity || "",
        formatDateTime(a.timestamp)
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Download using jsPDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica");

    // Title / Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("Helvetica", "bold");
    doc.text("WELL CARE HOSPITAL", 20, 26);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Tenant Scope: ${userData?.hospitalName || "Default Hospital"} • Date: ${new Date().toLocaleDateString()}`, 20, 34);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    
    let reportTitle = "";
    if (reportType === "patients") reportTitle = "Patient Directory Census";
    else if (reportType === "alerts") reportTitle = "Incident Alerts Audit Log";
    else reportTitle = "AI System Activity Detection log";
    
    doc.text(reportTitle, 20, 55);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 58, 190, 58);

    let y = 70;
    doc.setFontSize(10);

    if (reportType === "patients") {
      patients.forEach((item, index) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("Helvetica", "bold");
        doc.text(`${index + 1}. Patient Name: ${item.name || "Unknown"} (Room: ${item.room || "N/A"})`, 20, y);
        doc.setFont("Helvetica", "normal");
        doc.text(`Age: ${item.age || "N/A"} • Diagnosis: ${item.diagnosis || "N/A"} • Status: ${item.status || "N/A"}`, 25, y + 6);
        doc.text(`Attending Physician: ${item.doctor || "N/A"} • Contact: ${item.contact || "N/A"}`, 25, y + 12);
        y += 24;
      });
    } else {
      alerts.forEach((item, index) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("Helvetica", "bold");
        doc.text(`${index + 1}. Event: ${item.alertType || "Incident"} (Room: ${item.room || "N/A"})`, 20, y);
        doc.setFont("Helvetica", "normal");
        doc.text(`Patient: ${item.patientName || "Unknown"} • Severity: ${item.severity || "N/A"} • Status: ${item.status || "N/A"}`, 25, y + 6);
        doc.text(`Recorded: ${formatDateTime(item.timestamp)} • Notes: ${item.notes || "No resolution comments."}`, 25, y + 12);
        y += 24;
      });
    }

    doc.save(`${reportType}_report.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-sm">Retrieving Audit Log...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Reports & Audit Center
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Export clinical history, alert events, and AI observations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Select Report Category</h2>
          
          <div className="space-y-2">
            <button
              onClick={() => setReportType("patients")}
              className={`w-full text-left p-3.5 rounded-xl text-sm font-semibold transition cursor-pointer flex justify-between items-center ${
                reportType === "patients" ? "bg-blue-600 text-white shadow" : "bg-slate-950/40 border border-slate-850 hover:bg-slate-800"
              }`}
            >
              <span>📋 Patient Census</span>
              <span className="text-xs opacity-80">{patients.length} records</span>
            </button>

            <button
              onClick={() => setReportType("alerts")}
              className={`w-full text-left p-3.5 rounded-xl text-sm font-semibold transition cursor-pointer flex justify-between items-center ${
                reportType === "alerts" ? "bg-blue-600 text-white shadow" : "bg-slate-950/40 border border-slate-850 hover:bg-slate-800"
              }`}
            >
              <span>🚨 Alert Incident Logs</span>
              <span className="text-xs opacity-80">{alerts.length} records</span>
            </button>

            <button
              onClick={() => setReportType("ai")}
              className={`w-full text-left p-3.5 rounded-xl text-sm font-semibold transition cursor-pointer flex justify-between items-center ${
                reportType === "ai" ? "bg-blue-600 text-white shadow" : "bg-slate-950/40 border border-slate-850 hover:bg-slate-800"
              }`}
            >
              <span>🧠 AI Detection Analytics</span>
              <span className="text-xs opacity-80">{alerts.length} events</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800">
            <button
              onClick={downloadPDF}
              className="py-3 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📄</span> Export PDF
            </button>
            <button
              onClick={downloadExcel}
              className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📊</span> Export Excel
            </button>
          </div>
        </div>

        {/* Live Preview List */}
        <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Document Audit Preview</h2>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
            {reportType === "patients" ? (
              patients.map((item, index) => (
                <div key={item.id} className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-xs">
                  <p className="font-extrabold text-slate-200">{index + 1}. {item.name} (Room {item.room})</p>
                  <p className="text-slate-400 mt-1">Diagnosis: {item.diagnosis} • Status: {item.status} • Physician: {item.doctor || "N/A"}</p>
                </div>
              ))
            ) : (
              alerts.map((item, index) => (
                <div key={item.id} className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-xs">
                  <p className="font-extrabold text-slate-200">{index + 1}. {item.alertType} (Room {item.room})</p>
                  <p className="text-slate-400 mt-1">Patient: {item.patientName} • Severity: {item.severity} • Status: {item.status}</p>
                  {item.notes && <p className="text-slate-500 mt-1 italic">Notes: {item.notes}</p>}
                </div>
              ))
            )}

            {((reportType === "patients" && patients.length === 0) || (reportType !== "patients" && alerts.length === 0)) && (
              <p className="text-center text-slate-500 text-xs py-8">No records match current filters.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { jsPDF } from "jspdf";

export default function Reports() {
  const reports = [
    {
      patient: "Priya Nair",
      report: "Fall detected in Room 105",
      date: "30-05-2026"
    },
    {
      patient: "Rohan Verma",
      report: "Abnormal inactivity detected",
      date: "30-05-2026"
    },
    {
      patient: "Lakshmi Devi",
      report: "Patient distress alert",
      date: "30-05-2026"
    }
  ];

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Well Care Hospital", 20, 20);

    doc.setFontSize(14);
    doc.text(
      "AI Patient Monitoring Report",
      20,
      35
    );

    let y = 55;

    reports.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.patient}`,
        20,
        y
      );

      doc.text(
        `Report: ${item.report}`,
        30,
        y + 10
      );

      doc.text(
        `Date: ${item.date}`,
        30,
        y + 20
      );

      y += 35;
    });

    doc.save("Patient_Report.pdf");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Reports Center
      </h1>

      <div className="space-y-4">
        {reports.map((item, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl shadow"
          >
            <h2 className="font-bold text-lg">
              {item.patient}
            </h2>

            <p>{item.report}</p>

            <p className="text-gray-500">
              Date: {item.date}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={downloadPDF}
        className="mt-6 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
      >
        📄 Download PDF Report
      </button>
    </div>
  );
}
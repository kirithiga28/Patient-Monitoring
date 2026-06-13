export default function AIPredictions() {
  const predictions = [
    {
      patient: "Priya Nair",
      risk: "High",
      confidence: "96%",
      recommendation: "Immediate Observation"
    },
    {
      patient: "Lakshmi Devi",
      risk: "High",
      confidence: "94%",
      recommendation: "Continuous Monitoring"
    },
    {
      patient: "Rahul Gupta",
      risk: "Medium",
      confidence: "87%",
      recommendation: "Nurse Review"
    },
    {
      patient: "Rohan Verma",
      risk: "Medium",
      confidence: "82%",
      recommendation: "Regular Assessment"
    },
    {
      patient: "Aarav Sharma",
      risk: "Low",
      confidence: "98%",
      recommendation: "Routine Monitoring"
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        🧠 AI Predictions
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {predictions.map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow"
          >
            <h2 className="text-xl font-bold mb-3">
              {item.patient}
            </h2>

            <p>
              <strong>Predicted Risk:</strong>{" "}
              <span
                className={
                  item.risk === "High"
                    ? "text-red-600 font-bold"
                    : item.risk === "Medium"
                    ? "text-yellow-600 font-bold"
                    : "text-green-600 font-bold"
                }
              >
                {item.risk}
              </span>
            </p>

            <p className="mt-2">
              <strong>AI Confidence:</strong>{" "}
              {item.confidence}
            </p>

            <p className="mt-2">
              <strong>Recommendation:</strong>{" "}
              {item.recommendation}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl mt-8">
        <h2 className="text-lg font-bold mb-2">
          AI Summary
        </h2>

        <p>
          The AI model continuously analyzes patient
          activity patterns, inactivity duration,
          abnormal movements, fall events, and distress
          indicators to predict patient risk levels and
          recommend appropriate monitoring actions.
        </p>
      </div>
    </div>
  );
}
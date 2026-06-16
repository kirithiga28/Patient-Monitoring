import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";

export default function AddPatient() {
  const { hospitalId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    bloodGroup: "",
    room: "",
    diagnosis: "",
    status: "Stable",
    doctor: "",
    contact: "",
    history: ""
  });

  const handleChange = (e) => {
    setPatient({
      ...patient,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await patientService.addPatient(patient, hospitalId);
      alert("Patient Added Successfully to Repository");
      setPatient({
        name: "",
        age: "",
        bloodGroup: "",
        room: "",
        diagnosis: "",
        status: "Stable",
        doctor: "",
        contact: "",
        history: ""
      });
    } catch (error) {
      console.error(error);
      alert("Failed to add patient profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl font-sans text-slate-100 animate-fade-in">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Register Patient
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Add new patient profile. Scoped automatically to current hospital.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Patient Name"
              value={patient.name}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Age (Years)
            </label>
            <input
              name="age"
              type="number"
              required
              placeholder="Age"
              value={patient.age}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Blood Group
            </label>
            <input
              name="bloodGroup"
              type="text"
              required
              placeholder="e.g. O+, A-"
              value={patient.bloodGroup}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Room Code
            </label>
            <input
              name="room"
              type="text"
              required
              placeholder="Room Number"
              value={patient.room}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Diagnosis Summary
            </label>
            <input
              name="diagnosis"
              type="text"
              required
              placeholder="Primary Diagnosis"
              value={patient.diagnosis}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Status Rank
            </label>
            <select
              name="status"
              value={patient.status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            >
              <option value="Stable">Stable</option>
              <option value="Observation">Observation</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Primary Doctor Name
            </label>
            <input
              name="doctor"
              type="text"
              placeholder="Assigned Doctor"
              value={patient.doctor}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Emergency Contact
            </label>
            <input
              name="contact"
              type="text"
              required
              placeholder="Contact Number"
              value={patient.contact}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Medical History Log
          </label>
          <textarea
            name="history"
            placeholder="Document patient medical history and notes..."
            value={patient.history}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm h-32"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Registering..." : "➕ Add Patient Profile"}
        </button>
      </form>
    </div>
  );
}

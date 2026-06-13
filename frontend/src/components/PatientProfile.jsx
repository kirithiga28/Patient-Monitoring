import { useState } from "react";
import {
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";

export default function PatientProfile({
  patient,
  onBack,
}) {
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: patient.name || "",
    age: patient.age || "",
    bloodGroup: patient.bloodGroup || "",
    room: patient.room || "",
    diagnosis: patient.diagnosis || "",
    status: patient.status || "",
    doctor: patient.doctor || "",
    contact: patient.contact || "",
    history: patient.history || "",
  });

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(db, "patients", patient.id)
      );

      alert("Patient Deleted Successfully");
      onBack();
    } catch (error) {
      console.error(error);
      alert("Error deleting patient");
    }
  };

  const handleSave = async () => {
    try {
      await updateDoc(
        doc(db, "patients", patient.id),
        formData
      );

      alert("Patient Updated Successfully");
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert("Error updating patient");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          ← Back
        </button>

        <button
          onClick={() => setEditing(!editing)}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
        >
          ✏ Edit Patient
        </button>

        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          🗑 Delete Patient
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold">
            {formData.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")}
          </div>

          <div>
            {editing ? (
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border p-2 rounded text-2xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold">
                {formData.name}
              </h1>
            )}

            {editing ? (
              <input
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                className="border p-2 rounded mt-2"
              />
            ) : (
              <p className="text-slate-500">
                {formData.diagnosis}
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Age:</strong>{" "}
            {editing ? (
              <input
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="border ml-2 p-1 rounded"
              />
            ) : (
              formData.age
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Blood Group:</strong>{" "}
            {editing ? (
              <input
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="border ml-2 p-1 rounded"
              />
            ) : (
              formData.bloodGroup
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Room:</strong>{" "}
            {editing ? (
              <input
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="border ml-2 p-1 rounded"
              />
            ) : (
              formData.room
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Status:</strong>{" "}
            {editing ? (
              <input
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="border ml-2 p-1 rounded"
              />
            ) : (
              formData.status
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Doctor:</strong>{" "}
            {editing ? (
              <input
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                className="border ml-2 p-1 rounded"
              />
            ) : (
              formData.doctor
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Contact:</strong>{" "}
            {editing ? (
              <input
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="border ml-2 p-1 rounded"
              />
            ) : (
              formData.contact
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Risk Score:</strong> 92%
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Monitoring Status:</strong> Active
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Last Alert:</strong> Fall Detected
          </div>

          <div className="bg-slate-100 p-4 rounded-xl">
            <strong>Admission Date:</strong> 20-05-2026
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">
            Medical History
          </h2>

          {editing ? (
            <textarea
              name="history"
              value={formData.history}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl"
              rows="4"
            />
          ) : (
            <div className="bg-slate-100 p-4 rounded-xl">
              {formData.history}
            </div>
          )}
        </div>

        {editing && (
          <button
            onClick={handleSave}
            className="mt-6 bg-green-600 text-white px-5 py-3 rounded-lg"
          >
            💾 Save Changes
          </button>
        )}
      </div>
    </div>
  );
}
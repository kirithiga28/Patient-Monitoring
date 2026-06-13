import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AddPatient() {
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    bloodGroup: "",
    room: "",
    diagnosis: "",
    status: "",
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

    await addDoc(
      collection(db, "patients"),
      patient
    );

    alert("Patient Added Successfully");

    setPatient({
      name: "",
      age: "",
      bloodGroup: "",
      room: "",
      diagnosis: "",
      status: "",
      doctor: "",
      contact: "",
      history: ""
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">
        Add Patient
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4"
      >
        <input
          name="name"
          placeholder="Patient Name"
          value={patient.name}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="age"
          placeholder="Age"
          value={patient.age}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="bloodGroup"
          placeholder="Blood Group"
          value={patient.bloodGroup}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="room"
          placeholder="Room Number"
          value={patient.room}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="diagnosis"
          placeholder="Diagnosis"
          value={patient.diagnosis}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="status"
          placeholder="Status"
          value={patient.status}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="doctor"
          placeholder="Doctor"
          value={patient.doctor}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="contact"
          placeholder="Contact"
          value={patient.contact}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <textarea
          name="history"
          placeholder="Medical History"
          value={patient.history}
          onChange={handleChange}
          className="border p-3 rounded col-span-2"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-3 rounded col-span-2"
        >
          Add Patient
        </button>
      </form>
    </div>
  );
}
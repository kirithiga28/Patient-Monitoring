import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import PatientProfile from "./PatientProfile";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (selectedPatient) {
    return (
      <PatientProfile
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center text-xl mt-10">
        Loading Patients...
      </div>
    );
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Patients
        </h1>

        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
          Total Patients: {patients.length}
        </div>
      </div>

      <input
        type="text"
        placeholder="Search Patient..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="w-full border p-3 rounded-lg mb-6"
      />

      <div className="space-y-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() =>
              setSelectedPatient(patient)
            }
            className="bg-white p-5 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-xl">
                  {patient.name}
                </h2>

                <p>Age: {patient.age}</p>

                <p>
                  Diagnosis: {patient.diagnosis}
                </p>

                <p>
                  Room: {patient.room}
                </p>
              </div>

              <div>
                <span
                  className={`px-3 py-1 rounded-full text-white font-semibold ${
                    patient.status === "Critical"
                      ? "bg-red-500"
                      : patient.status ===
                        "Observation"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                >
                  {patient.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
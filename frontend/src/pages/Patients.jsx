import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import PatientProfile from "./PatientProfile";

export default function Patients() {
  const { role, hospitalId, userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterGender, setFilterGender] = useState("All");

  // Registration form state with all standard clinical fields
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "O+",
    contact: "",
    phone: "",
    address: "",
    diagnosis: "",
    history: "",
    currentMedication: "",
    doctor: "",
    room: "",
    admissionDate: new Date().toISOString().split("T")[0],
    emergencyContact: "",
    status: "Stable"
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  useEffect(() => {
    if (userData?.name) {
      setNewPatient(prev => ({ ...prev, doctor: userData.name }));
    }
  }, [userData]);

  // Real-time patient subscription with DOCTOR OWNERSHIP isolation
  useEffect(() => {
    if (!userData) return;

    setLoading(true);
    const unsubscribe = patientService.listenPatients(
      role,
      hospitalId,
      userData, // Current doctor profile for ownership filtering
      userData?.assignedRooms,
      (patientList) => {
        setPatients(patientList);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [role, hospitalId, userData]);

  const handleAddPatient = async (e) => {
    e.preventDefault();

    if (!newPatient.name.trim()) {
      showToast("Please enter the patient's name.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await patientService.addPatient(
        {
          ...newPatient,
          doctor: userData?.name || newPatient.doctor || "Dr. WellCare",
          doctorId: userData?.id || userData?.uid || "DOC-1001",
          doctorEmail: userData?.email || "doctor@wellcare.com"
        },
        hospitalId,
        userData
      );

      showToast(`Patient ${created.name} registered successfully! Patient ID: ${created.patientId || created.id}`);
      setIsAdding(false);

      // Reset Form
      setNewPatient({
        name: "",
        age: "",
        gender: "Male",
        bloodGroup: "O+",
        contact: "",
        phone: "",
        address: "",
        diagnosis: "",
        history: "",
        currentMedication: "",
        doctor: userData?.name || "",
        room: "",
        admissionDate: new Date().toISOString().split("T")[0],
        emergencyContact: "",
        status: "Stable"
      });
    } catch (error) {
      console.error("Failed to register patient:", error);
      showToast(error.message || "Failed to create patient record. Please check server logs.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filtered patients for search/status
  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.patientId && p.patientId.toLowerCase().includes(search.toLowerCase())) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    const matchesGender = filterGender === "All" || p.gender === filterGender;

    return matchesSearch && matchesStatus && matchesGender;
  });

  if (selectedPatient) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedPatient(null)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center cursor-pointer shadow"
        >
          ← Back to Patient Directory
        </button>
        <PatientProfile patientId={selectedPatient.id || selectedPatient.patientId} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      {/* Floating Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center animate-bounce ${
          toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}>
          <span className="mr-2 text-base">{toast.type === "error" ? "⚠️" : "✅"}</span>
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-blue-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center">
            👨‍⚕️ Patient Directory Workspace
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Displaying patient records assigned to <span className="text-blue-400 font-semibold">{userData?.name || "Logged-in Doctor"}</span>
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer flex items-center"
        >
          {isAdding ? "✕ Close Register Form" : "+ Register New Patient"}
        </button>
      </div>

      {/* REGISTRATION FORM MODAL / PANEL */}
      {isAdding && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl animate-slide-in">
          <h2 className="text-base font-extrabold text-white mb-4 flex items-center">
            📝 Register New Hospital Patient
          </h2>

          <form onSubmit={handleAddPatient} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Patient Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={newPatient.name}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="e.g. 29"
                  value={newPatient.age}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Gender</label>
                <select
                  name="gender"
                  value={newPatient.gender}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={newPatient.bloodGroup}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="contact"
                  placeholder="e.g. +1-555-0199"
                  value={newPatient.contact}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Room Number</label>
                <input
                  type="text"
                  name="room"
                  placeholder="e.g. Room 105"
                  value={newPatient.room}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  placeholder="e.g. Acute Seizure Observation"
                  value={newPatient.diagnosis}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Current Medication</label>
                <input
                  type="text"
                  name="currentMedication"
                  placeholder="e.g. Anticonvulsants 50mg"
                  value={newPatient.currentMedication}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Clinical Status</label>
                <select
                  name="status"
                  value={newPatient.status}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500 font-bold"
                >
                  <option value="Stable">Stable</option>
                  <option value="Critical">Critical</option>
                  <option value="Observation">Observation</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Medical History</label>
                <textarea
                  name="history"
                  rows="2"
                  placeholder="e.g. History of high blood pressure and seizure episodes"
                  value={newPatient.history}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Emergency Contact & Address</label>
                <textarea
                  name="address"
                  rows="2"
                  placeholder="Address & emergency contact details"
                  value={newPatient.address}
                  onChange={handleFieldChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Saving Record...
                  </span>
                ) : (
                  "Save Patient to Database"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="🔍 Search patient name, ID, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <span className="text-slate-400 mr-2 font-bold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Stable">Stable</option>
              <option value="Critical">Critical</option>
              <option value="Observation">Observation</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>

          <div>
            <span className="text-slate-400 mr-2 font-bold">Gender:</span>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* PATIENT LIST TABLE / CARDS */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-400 text-xs font-semibold">Loading doctor patient directory...</span>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
          <div className="text-4xl">🏥</div>
          <h3 className="text-base font-bold text-white">No Patients Registered Yet</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            You currently have no patient records in your doctor workspace (<span className="text-blue-400 font-semibold">{userData?.name || "Logged-in Doctor"}</span>). Click "+ Register New Patient" to add your first patient.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id || patient.patientId}
              onClick={() => setSelectedPatient(patient)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                    {patient.patientId || patient.id}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-2">{patient.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {patient.age} Yrs • {patient.gender} • <span className="text-blue-400 font-bold">{patient.bloodGroup}</span>
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                  patient.status === "Critical" ? "bg-red-950/80 text-red-400 border-red-500/50 animate-pulse" :
                  patient.status === "Stable" ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/50" :
                  patient.status === "Observation" ? "bg-amber-950/80 text-amber-400 border-amber-500/50" :
                  "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {patient.status}
                </span>
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Diagnosis:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[170px]">{patient.diagnosis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-mono text-blue-300 font-bold">{patient.room || "Unassigned"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Doctor:</span>
                  <span className="font-semibold text-emerald-400 truncate max-w-[170px]">{patient.doctor}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-800/50 text-[11px]">
                <span className="text-slate-500 font-mono">Admitted: {patient.admissionDate || "2026-07-01"}</span>
                <span className="text-blue-400 font-bold hover:underline">View Medical File →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

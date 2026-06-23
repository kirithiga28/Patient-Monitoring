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

  // Search, Filter, Sort state variables
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [filterDoctor, setFilterDoctor] = useState("All");
  const [sortBy, setSortBy] = useState("name_asc");

  // Registration form state
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "O+",
    doctor: "",
    room: "",
    contact: "",
    address: "",
    diagnosis: "",
    history: "",
    status: "Stable",
    riskScore: 10,
    admissionDate: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    if (userData?.name) {
      setNewPatient(prev => ({ ...prev, doctor: userData.name }));
    }
  }, [userData]);

  useEffect(() => {
    const unsubscribe = patientService.listenPatients(
      role,
      hospitalId,
      userData?.assignedPatients,
      userData?.assignedRooms,
      (patientList) => {
        setPatients(patientList);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [role, hospitalId, userData]);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await patientService.addPatient(newPatient, hospitalId);
      alert("Patient Registered Successfully");
      setIsAdding(false);
      setNewPatient({
        name: "",
        age: "",
        gender: "Male",
        bloodGroup: "O+",
        doctor: userData?.name || "",
        room: "",
        contact: "",
        address: "",
        diagnosis: "",
        history: "",
        status: "Stable",
        riskScore: 10,
        admissionDate: new Date().toISOString().split("T")[0]
      });
    } catch (error) {
      console.error(error);
      alert("Failed to create patient record");
    }
  };

  const handleFieldChange = (e) => {
    setNewPatient({
      ...newPatient,
      [e.target.name]: e.target.value
    });
  };

  // Get distinct doctors for filtering
  const distinctDoctors = ["All", ...new Set(patients.map((p) => p.doctor).filter(Boolean))];

  // Process data locally (Search -> Filter -> Sort)
  const processedPatients = patients
    .filter((p) => {
      // Case-insensitive search on name, room, and diagnosis
      const matchesSearch = 
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.room || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.diagnosis || "").toLowerCase().includes(search.toLowerCase());

      // Filter by Status
      const matchesStatus = filterStatus === "All" || p.status === filterStatus;

      // Filter by Gender
      const matchesGender = filterGender === "All" || p.gender === filterGender;

      // Filter by Doctor
      const matchesDoctor = filterDoctor === "All" || p.doctor === filterDoctor;

      return matchesSearch && matchesStatus && matchesGender && matchesDoctor;
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      
      if (sortBy === "age_asc") return (Number(a.age) || 0) - (Number(b.age) || 0);
      if (sortBy === "age_desc") return (Number(b.age) || 0) - (Number(a.age) || 0);

      if (sortBy === "risk_asc") return (Number(a.riskScore) || 0) - (Number(b.riskScore) || 0);
      if (sortBy === "risk_desc") return (Number(b.riskScore) || 0) - (Number(a.riskScore) || 0);

      if (sortBy === "date_asc") return (a.admissionDate || "").localeCompare(b.admissionDate || "");
      if (sortBy === "date_desc") return (b.admissionDate || "").localeCompare(a.admissionDate || "");

      return 0;
    });

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-sm">Accessing clinical index...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Clinical Patient Directory
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time updates. Scoped by organization assignments.
          </p>
        </div>

        {role !== "caregiver" && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-blue-600/10"
          >
            {isAdding ? "Close Panel" : "➕ Register Patient"}
          </button>
        )}
      </div>

      {/* Register Patient Form Overlay */}
      {isAdding && (
        <form onSubmit={handleAddPatient} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 max-w-3xl animate-slide-in">
          <h2 className="text-lg font-bold border-b border-slate-850 pb-2">Register Patient Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <input
                name="name"
                required
                placeholder="John Doe"
                value={newPatient.name}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Age</label>
              <input
                name="age"
                type="number"
                required
                placeholder="Age"
                value={newPatient.age}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Gender</label>
              <select
                name="gender"
                value={newPatient.gender}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Blood Group</label>
              <input
                name="bloodGroup"
                required
                placeholder="O+"
                value={newPatient.bloodGroup}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Attending Doctor</label>
              <input
                name="doctor"
                required
                placeholder="Dr. Smith"
                value={newPatient.doctor}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Room Code</label>
              <input
                name="room"
                required
                placeholder="Room 101"
                value={newPatient.room}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Contact Phone</label>
              <input
                name="contact"
                required
                placeholder="555-0199"
                value={newPatient.contact}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Address</label>
              <input
                name="address"
                required
                placeholder="123 Health Ave, Medical City"
                value={newPatient.address || ""}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Risk Score (0-100)</label>
              <input
                name="riskScore"
                type="number"
                min="0"
                max="100"
                required
                value={newPatient.riskScore}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Admission Date</label>
              <input
                name="admissionDate"
                type="date"
                required
                value={newPatient.admissionDate}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="text-slate-400 block mb-1">Primary Diagnosis Summary</label>
              <input
                name="diagnosis"
                required
                placeholder="Primary health reason for admission"
                value={newPatient.diagnosis}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="text-slate-400 block mb-1">Medical History Background</label>
              <textarea
                name="history"
                placeholder="Previous surgical procedures, allergies, chronical diagnoses..."
                value={newPatient.history}
                onChange={handleFieldChange}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white outline-none focus:border-blue-500 h-20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Create Patient Document
          </button>
        </form>
      )}

      {/* Search and Filters Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search patient by Name, Room or Diagnosis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-blue-500/50"
        />

        {/* Dynamic filters layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div>
            <label className="text-slate-400 font-bold block mb-1">Health Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Stable">Stable</option>
              <option value="Observation">Observation</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">Gender Scope</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">Primary Doctor</label>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none"
            >
              {distinctDoctors.map((doc) => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-bold block mb-1">Sort Catalog By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="age_asc">Age (Youngest First)</option>
              <option value="age_desc">Age (Oldest First)</option>
              <option value="risk_desc">Risk Score (Highest First)</option>
              <option value="risk_asc">Risk Score (Lowest First)</option>
              <option value="date_desc">Admission (Newest First)</option>
              <option value="date_asc">Admission (Oldest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory list of patients */}
      <div className="grid md:grid-cols-2 gap-4">
        {processedPatients.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPatient(p)}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-blue-500/40 cursor-pointer shadow hover:shadow-xl transition flex justify-between items-start group"
          >
            <div className="space-y-2">
              <h2 className="font-extrabold text-lg text-slate-100 group-hover:text-blue-400 transition">{p.name}</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                <p><span className="text-slate-500">Age/Gender:</span> {p.age} yrs • {p.gender}</p>
                <p><span className="text-slate-500">Room:</span> Room {p.room}</p>
                <p className="col-span-2"><span className="text-slate-500">Physician:</span> {p.doctor}</p>
                <p className="col-span-2 truncate"><span className="text-slate-500">Diagnosis:</span> {p.diagnosis}</p>
                <p className="col-span-2"><span className="text-slate-500">Admission:</span> {p.admissionDate}</p>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between h-full space-y-4">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                p.status === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                p.status === "Observation" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
                "text-green-400 bg-green-500/10 border-green-500/20"
              }`}>
                {p.status}
              </span>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Risk Score</span>
                <span className={`font-black text-sm ${
                  p.riskScore > 75 ? "text-red-400" :
                  p.riskScore > 50 ? "text-orange-400" :
                  p.riskScore > 25 ? "text-yellow-400" :
                  "text-green-400"
                }`}>
                  {p.riskScore}%
                </span>
              </div>
            </div>
          </div>
        ))}

        {processedPatients.length === 0 && (
          <p className="text-center text-slate-500 py-12 text-sm col-span-2">No patients match the filters or search.</p>
        )}
      </div>
    </div>
  );
}

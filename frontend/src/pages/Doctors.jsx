import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { doctorService } from "../services/doctorService";
import { patientService } from "../services/patientService";

export default function Doctors() {
  const { role, hospitalId } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    email: "",
    phone: "",
    experience: "",
    assignedPatients: []
  });

  useEffect(() => {
    const unsubDoctors = doctorService.listenDoctors(role, hospitalId, (docList) => {
      setDoctors(docList);
      setLoading(false);
      // Auto-update selected doctor reference if open
      if (selectedDoctor) {
        const updated = docList.find(d => d.id === selectedDoctor.id);
        if (updated) setSelectedDoctor(updated);
      }
    });

    const unsubPatients = patientService.listenPatients(role, hospitalId, null, null, (patientList) => {
      setPatients(patientList);
    });

    return () => {
      unsubDoctors();
      unsubPatients();
    };
  }, [role, hospitalId, selectedDoctor?.id]);

  const handleEditTrigger = (docItem) => {
    setFormData({
      name: docItem.name || "",
      specialization: docItem.specialization || "",
      email: docItem.email || "",
      phone: docItem.phone || "",
      experience: docItem.experience || "",
      assignedPatients: docItem.assignedPatients || []
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing && selectedDoctor) {
        await doctorService.updateDoctor(selectedDoctor.id, formData);
        alert("Doctor Profile Updated");
        setEditing(false);
      } else {
        await doctorService.addDoctor(formData, hospitalId);
        alert("Doctor Profile Registered");
        setIsAdding(false);
      }
      setFormData({ name: "", specialization: "", email: "", phone: "", experience: "", assignedPatients: [] });
    } catch (error) {
      console.error(error);
      alert("Error saving profile details");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this doctor registration?");
    if (!confirmDelete) return;

    try {
      await doctorService.deleteDoctor(id);
      alert("Doctor Profile Removed");
      setSelectedDoctor(null);
    } catch (error) {
      console.error(error);
      alert("Error deleting doctor record");
    }
  };

  const handlePatientAssignmentToggle = async (patientId, doctorItem) => {
    const isAssigned = (doctorItem.assignedPatients || []).includes(patientId);
    const updatedAssignments = isAssigned
      ? doctorItem.assignedPatients.filter(id => id !== patientId)
      : [...(doctorItem.assignedPatients || []), patientId];

    try {
      await doctorService.updateDoctor(doctorItem.id, {
        assignedPatients: updatedAssignments
      });
      // Also update patient's doctor field mapping
      await patientService.updatePatient(patientId, {
        doctor: isAssigned ? "Unassigned" : doctorItem.name
      });
    } catch (error) {
      console.error(error);
      alert("Failed to update patient mapping");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-sm">Mapping medical registries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Clinical Physicians Registry
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage specialization areas, contact information, and assign patient ward rounds.
          </p>
        </div>

        {role !== "caregiver" && (
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditing(false);
              setFormData({ name: "", specialization: "", email: "", phone: "", experience: "", assignedPatients: [] });
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {isAdding ? "Close Panel" : "➕ Register Doctor"}
          </button>
        )}
      </div>

      {/* Profile Form (Add / Edit) */}
      {(isAdding || editing) && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 max-w-3xl animate-slide-in">
          <h2 className="text-lg font-bold border-b border-slate-850 pb-2">
            {editing ? `Modify Profile - ${selectedDoctor?.name}` : "Register Physician"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <input
                name="name"
                required
                placeholder="Dr. Emily Watson"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Specialization</label>
              <input
                name="specialization"
                required
                placeholder="Neurology, Cardiology..."
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Contact Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="physician@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Contact Phone</label>
              <input
                name="phone"
                required
                placeholder="555-9011"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="text-slate-400 block mb-1">Years of Clinical Experience</label>
              <input
                name="experience"
                type="number"
                required
                placeholder="e.g. 12"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {editing ? "Save Profile Changes" : "Register Doctor Details"}
          </button>
        </form>
      )}

      {/* Main viewport */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Doctors list catalog */}
        <div className="space-y-4 md:col-span-1">
          <h2 className="text-sm text-slate-400 uppercase tracking-widest font-black">Active Physicians ({doctors.length})</h2>
          
          <div className="space-y-2">
            {doctors.map((docItem) => (
              <div
                key={docItem.id}
                onClick={() => {
                  setSelectedDoctor(docItem);
                  setEditing(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col space-y-1 ${
                  selectedDoctor?.id === docItem.id
                    ? "bg-blue-600/10 border-blue-500/80 text-white"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <h3 className="font-extrabold text-sm text-slate-100">{docItem.name}</h3>
                <p className="text-[10px] text-slate-400">{docItem.specialization}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{docItem.assignedPatients?.length || 0} patients mapped</p>
              </div>
            ))}

            {doctors.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-8 bg-slate-900/50 rounded-2xl border border-slate-850 border-dashed">No physicians registered.</p>
            )}
          </div>
        </div>

        {/* Selected Doctor Profile Details Card */}
        <div className="md:col-span-2">
          {selectedDoctor ? (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-850">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">{selectedDoctor.name}</h2>
                  <p className="text-xs text-blue-400 font-semibold">{selectedDoctor.specialization}</p>
                </div>

                {role !== "caregiver" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTrigger(selectedDoctor)}
                      className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 rounded-xl text-[10px] font-black transition cursor-pointer"
                    >
                      Edit Details
                    </button>
                    {(role === "super_admin" || role === "hospital_admin") && (
                      <button
                        onClick={() => handleDelete(selectedDoctor.id)}
                        className="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black transition cursor-pointer"
                      >
                        Delete File
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl">
                  <span className="text-slate-500 font-bold block mb-1">Email Address</span>
                  <span className="text-slate-200">{selectedDoctor.email}</span>
                </div>
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl">
                  <span className="text-slate-500 font-bold block mb-1">Contact Phone</span>
                  <span className="text-slate-200">{selectedDoctor.phone}</span>
                </div>
                <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl col-span-2">
                  <span className="text-slate-500 font-bold block mb-1">Experience Years</span>
                  <span className="text-slate-200">{selectedDoctor.experience} years of clinical rounds</span>
                </div>
              </div>

              {/* Roster assignments panel */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <h3 className="text-sm font-bold text-slate-300">Assign Patient Coverage</h3>
                
                <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  {patients.map(p => {
                    const isAssigned = (selectedDoctor.assignedPatients || []).includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center justify-between text-xs text-slate-300 p-2 hover:bg-slate-900 rounded-lg cursor-pointer">
                        <span>{p.name} (Room {p.room})</span>
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          disabled={role === "caregiver"}
                          onChange={() => handlePatientAssignmentToggle(p.id, selectedDoctor)}
                          className="rounded accent-blue-600"
                        />
                      </label>
                    );
                  })}

                  {patients.length === 0 && (
                    <p className="text-center text-slate-600 text-xs py-4 col-span-2">No patients registered to assign.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Patient List ({selectedDoctor.assignedPatients?.length || 0})</h4>
                  <div className="space-y-2">
                    {selectedDoctor.assignedPatients?.map(pId => {
                      const matchPatient = patients.find(p => p.id === pId);
                      if (!matchPatient) return null;
                      return (
                        <div key={pId} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-extrabold text-slate-200">{matchPatient.name}</p>
                            <p className="text-slate-400 mt-0.5">Room {matchPatient.room} • Diagnosis: {matchPatient.diagnosis}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            matchPatient.status === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                            matchPatient.status === "Observation" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
                            "text-green-400 bg-green-500/10 border-green-500/20"
                          }`}>
                            {matchPatient.status}
                          </span>
                        </div>
                      );
                    })}

                    {(!selectedDoctor.assignedPatients || selectedDoctor.assignedPatients.length === 0) && (
                      <p className="text-slate-500 text-xs italic">No patients assigned to this physician.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 bg-slate-905/30 rounded-2xl border border-slate-850 border-dashed text-slate-500 text-center h-full">
              <span className="text-5xl mb-2">🩺</span>
              <p className="text-sm font-semibold">Select a Physician</p>
              <p className="text-xs text-slate-600 mt-1">Review contact, specialty profiles, and patient assignments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

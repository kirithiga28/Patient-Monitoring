import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { treatmentService } from "../services/treatmentService";
import { db } from "../firebase/config";
import { doc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { DataTable } from "../components/ui/DataTable";

export default function DoctorProfile() {
  const { userData, hospitalId } = useAuth();
  
  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    specialization: "",
    experience: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Stats States (Real-time counts)
  const [stats, setStats] = useState({
    patientsCount: 0,
    recordsCount: 0,
    criticalCount: 0,
    alertsCount: 0
  });

  // Treatments States
  const [treatments, setTreatments] = useState([]);
  const [isAddingTreatment, setIsAddingTreatment] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    patientName: "",
    treatmentType: "General Care",
    diagnosis: "",
    date: new Date().toISOString().split("T")[0],
    status: "Ongoing"
  });
  const [isSavingTreatment, setIsSavingTreatment] = useState(false);

  // Initialize edit form when userData loads
  useEffect(() => {
    if (userData) {
      setEditForm({
        name: userData.name || "",
        mobile: userData.mobile || "",
        specialization: userData.specialization || "General Medicine",
        experience: userData.experience || "5"
      });
    }
  }, [userData]);

  // Real-time subscriptions for activity center metrics & treatments
  useEffect(() => {
    if (!hospitalId || !userData?.uid) return;

    const currentHospitalId = hospitalId || "WHC-2026-1001";

    // 1. Subscribe to Patients count for this hospital
    const qPatients = query(
      collection(db, "patients"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubPatients = onSnapshot(qPatients, (snap) => {
      // We can either count total hospital patients or patients assigned to this doctor
      // Counting patients assigned to this specific doctor matches the profile workspace best:
      const doctorPatients = snap.docs.filter(doc => doc.data().doctor === userData.name);
      setStats(prev => ({ ...prev, patientsCount: doctorPatients.length }));
    }, (err) => console.error("Error listening to patients count:", err));

    // 2. Subscribe to Critical Patients count for this hospital
    const qCritical = query(
      collection(db, "critical_patients"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubCritical = onSnapshot(qCritical, (snap) => {
      // Filter by doctor name if matching
      const doctorCrit = snap.docs.filter(doc => doc.data().doctor === userData.name);
      setStats(prev => ({ ...prev, criticalCount: doctorCrit.length }));
    }, (err) => console.error("Error listening to critical patients count:", err));

    // 3. Subscribe to Emergency Alerts count
    const qAlerts = query(
      collection(db, "alerts"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubAlerts = onSnapshot(qAlerts, (snap) => {
      // Count alerts raised in the hospital or resolved by this doctor
      setStats(prev => ({ ...prev, alertsCount: snap.size }));
    }, (err) => console.error("Error listening to alerts count:", err));

    // 4. Subscribe to Medical Records count
    const qRecords = query(
      collection(db, "medical_records"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubRecords = onSnapshot(qRecords, (snap) => {
      setStats(prev => ({ ...prev, recordsCount: snap.size }));
    }, (err) => console.error("Error listening to records count:", err));

    // 5. Subscribe to Treatments collection
    const unsubTreatments = treatmentService.listenTreatments(userData.uid, (list) => {
      setTreatments(list);
    });

    return () => {
      unsubPatients();
      unsubCritical();
      unsubAlerts();
      unsubRecords();
      unsubTreatments();
    };
  }, [hospitalId, userData]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!userData?.uid) return;
    setIsSavingProfile(true);
    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        name: editForm.name,
        mobile: editForm.mobile,
        specialization: editForm.specialization,
        experience: editForm.experience
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile records");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Add Treatment
  const handleAddTreatment = async (e) => {
    e.preventDefault();
    if (!userData?.uid) return;
    setIsSavingTreatment(true);
    try {
      await treatmentService.addTreatment({
        ...treatmentForm,
        doctorId: userData.uid,
        hospitalId: hospitalId || "WHC-2026-1001"
      });
      setIsAddingTreatment(false);
      setTreatmentForm({
        patientName: "",
        treatmentType: "General Care",
        diagnosis: "",
        date: new Date().toISOString().split("T")[0],
        status: "Ongoing"
      });
    } catch (err) {
      console.error("Error adding treatment:", err);
      alert("Failed to save treatment record");
    } finally {
      setIsSavingTreatment(false);
    }
  };

  const treatmentColumns = [
    { key: "patientName", label: "Patient Name" },
    { key: "treatmentType", label: "Treatment Type", render: (row) => <span className="font-semibold text-blue-400">{row.treatmentType}</span> },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "date", label: "Prescribed Date", render: (row) => <span className="font-mono text-slate-400">{row.date}</span> },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          row.status === "Ongoing" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
          row.status === "Completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
          "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-blue-600">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Doctor Profile Workspace
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Manage professional clinical details, track active ward activities, and treatments registry.
        </p>
      </div>

      {/* Profile & Activity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-cyan-500 absolute top-0 inset-x-0 opacity-20" />
            <CardContent className="pt-12 space-y-6 relative">
              
              {/* Doctor Avatar Placeholder */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-slate-950 border-4 border-slate-800 rounded-full flex items-center justify-center text-2xl shadow-inner text-blue-400 select-none">
                  👨‍⚕️
                </div>
                <h2 className="text-lg font-extrabold text-white mt-3">{userData?.name || "Dr. Rajesh Mehta"}</h2>
                <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest mt-1">
                  {userData?.specialization || "General Medicine"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{userData?.experience || "5"} Years of Clinical Exp.</p>
              </div>

              {/* Profile Details List */}
              <div className="border-t border-slate-850 pt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="text-slate-300 font-semibold">{userData?.email || "doctor@wellcare.com"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Contact Number</span>
                  <span className="text-slate-300 font-semibold">{userData?.mobile || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Medical Reg No</span>
                  <span className="text-slate-300 font-mono font-semibold">{userData?.medRegNo || "REG-2026-9901"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Hospital Tenant</span>
                  <span className="text-slate-300 font-semibold">Well Care Hospital</span>
                </div>
                <div className="flex justify-between border-t border-slate-850/50 pt-2">
                  <span className="text-slate-500 font-medium">Hospital Code</span>
                  <span className="text-cyan-400 font-mono font-bold">{userData?.hospitalCode || "WHC-2026-1001"}</span>
                </div>
              </div>

              {/* Edit / Close Edit Form Trigger */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isEditing ? "Cancel Modifications" : "📝 Edit Clinical Details"}
              </button>

            </CardContent>
          </Card>

          {/* Edit Form (Toggled) */}
          {isEditing && (
            <Card className="bg-slate-900 border-slate-800 animate-slide-in">
              <CardHeader>
                <CardTitle>Edit Clinical Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input
                      required
                      placeholder="Doctor Full Name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Mobile Phone</label>
                    <input
                      placeholder="Mobile Phone"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Specialization</label>
                    <input
                      placeholder="Specialization (e.g. Cardiology)"
                      value={editForm.specialization}
                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Years of Experience</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editForm.experience}
                      onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    {isSavingProfile ? "Saving..." : "Save Profile Details"}
                  </button>
                </form>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Activity & Performance Metrics Grid */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle>Doctor Activity Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* StatCards Row */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                  title="Patients Assigned" 
                  value={stats.patientsCount} 
                  icon="👨‍⚕️" 
                  color="blue" 
                />
                <StatCard 
                  title="Medical Records" 
                  value={stats.recordsCount} 
                  icon="📋" 
                  color="cyan" 
                />
                <StatCard 
                  title="Assigned Critical Cases" 
                  value={stats.criticalCount} 
                  icon="🚨" 
                  color="red" 
                />
                <StatCard 
                  title="Total Emergency Alerts" 
                  value={stats.alertsCount} 
                  icon="🆘" 
                  color="amber" 
                />
              </div>

              {/* Last Login display */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-bold block uppercase">Last Activity Session Login</span>
                  <span className="text-slate-300 font-semibold font-mono mt-1 block">
                    {userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString() : "First Session Login"}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-green-500/10 text-green-400 font-bold tracking-wider uppercase text-[9px] border border-green-500/20 select-none">
                  ONLINE
                </span>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {/* Treatments Section */}
      <div className="space-y-4">
        <DataTable
          columns={treatmentColumns}
          data={treatments}
          searchKey="patientName"
          searchPlaceholder="Search treatments by patient..."
          emptyMessage="No Treatments Available"
          actionButton={
            <button
              onClick={() => setIsAddingTreatment(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow shadow-blue-600/10"
            >
              ➕ Add Treatment Record
            </button>
          }
        />
      </div>

      {/* Add Treatment Modal */}
      {isAddingTreatment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in text-xs text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Patient Treatment</h3>
              <button 
                onClick={() => setIsAddingTreatment(false)}
                className="text-slate-500 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTreatment} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Patient Name</label>
                <input
                  required
                  placeholder="Patient Name"
                  value={treatmentForm.patientName}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, patientName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Treatment Type</label>
                <select
                  value={treatmentForm.treatmentType}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, treatmentType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="General Care">General Care</option>
                  <option value="Medication">Medication</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Therapy">Therapy</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Diagnosis Summary</label>
                <input
                  required
                  placeholder="Primary diagnosis details"
                  value={treatmentForm.diagnosis}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, diagnosis: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={treatmentForm.date}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select
                    value={treatmentForm.status}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingTreatment(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTreatment}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition cursor-pointer shadow shadow-blue-600/10"
                >
                  {isSavingTreatment ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

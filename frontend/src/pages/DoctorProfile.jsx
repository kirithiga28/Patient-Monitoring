import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { treatmentService } from "../services/treatmentService";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { DataTable } from "../components/ui/DataTable";

export default function DoctorProfile() {
  const { userData, updateDoctorProfile, hospitalId } = useAuth();
  
  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    department: "",
    qualification: "",
    profilePhoto: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Stats States
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
        mobile: userData.mobile || userData.phone || "",
        department: userData.department || userData.specialization || "General Medicine",
        qualification: userData.qualification || "MBBS, MD",
        profilePhoto: userData.profilePhoto || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"
      });
    }
  }, [userData]);

  // Subscriptions for metrics & treatments
  useEffect(() => {
    if (!userData) return;
    const currentHospitalId = hospitalId || "WHC-2026-1001";
    const docName = userData.name;
    const docId = userData.id || userData.uid;
    const docEmail = userData.email;

    // 1. Patients count assigned to this doctor
    const qPatients = query(
      collection(db, "patients"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubPatients = onSnapshot(qPatients, (snap) => {
      const doctorPatients = snap.docs.filter(d => {
        const data = d.data();
        return data.doctor === docName || data.doctorId === docId || data.doctorEmail === docEmail;
      });
      setStats(prev => ({ ...prev, patientsCount: doctorPatients.length }));
    }, (err) => console.warn("Patients count listener warning:", err.message));

    // 2. Critical Patients
    const qCritical = query(
      collection(db, "critical_patients"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubCritical = onSnapshot(qCritical, (snap) => {
      const doctorCrit = snap.docs.filter(d => {
        const data = d.data();
        return data.doctor === docName || data.doctorId === docId;
      });
      setStats(prev => ({ ...prev, criticalCount: doctorCrit.length }));
    }, (err) => console.warn("Critical count listener warning:", err.message));

    // 3. Emergency Alerts count for this doctor
    const qAlerts = query(
      collection(db, "alerts"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubAlerts = onSnapshot(qAlerts, (snap) => {
      const docAlerts = snap.docs.filter(d => {
        const data = d.data();
        return data.doctorId === docId || data.doctorEmail === docEmail || data.createdBy === docId;
      });
      setStats(prev => ({ ...prev, alertsCount: docAlerts.length }));
    }, (err) => console.warn("Alerts count listener warning:", err.message));

    // 4. Medical Records count for this doctor
    const qRecords = query(
      collection(db, "medical_records"),
      where("hospitalId", "==", currentHospitalId)
    );
    const unsubRecords = onSnapshot(qRecords, (snap) => {
      const docRecords = snap.docs.filter(d => {
        const data = d.data();
        return data.doctorId === docId || data.doctorEmail === docEmail || data.doctor === docName;
      });
      setStats(prev => ({ ...prev, recordsCount: docRecords.length }));
    }, (err) => console.warn("Records count listener warning:", err.message));

    // 5. Treatments
    const unsubTreatments = treatmentService.listenTreatments(docId, (list) => {
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
    if (!userData) return;
    setIsSavingProfile(true);
    try {
      await updateDoctorProfile({
        name: editForm.name,
        mobile: editForm.mobile,
        department: editForm.department,
        specialization: editForm.department,
        qualification: editForm.qualification,
        profilePhoto: editForm.profilePhoto
      });
      setIsEditing(false);
      setToastMessage("Doctor profile updated successfully!");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update doctor profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Add Treatment
  const handleAddTreatment = async (e) => {
    e.preventDefault();
    if (!userData) return;
    setIsSavingTreatment(true);
    try {
      await treatmentService.addTreatment({
        ...treatmentForm,
        doctorId: userData.id || userData.uid,
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
      setToastMessage("Treatment record saved successfully!");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.error("Error adding treatment:", err);
      alert("Failed to save treatment record.");
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
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl font-semibold text-xs flex items-center animate-bounce">
          <span className="mr-2">✅</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg border-l-4 border-l-blue-600">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Doctor Personal Profile & Workspace
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Authorized hospital doctor profile, assigned patient metrics, and treatment history.
        </p>
      </div>

      {/* Profile & Activity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-cyan-500 absolute top-0 inset-x-0 opacity-20" />
            <CardContent className="pt-12 space-y-6 relative">
              
              {/* Doctor Avatar */}
              <div className="flex flex-col items-center text-center">
                <img
                  src={userData?.profilePhoto || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
                  alt="Doctor Avatar"
                  className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover shadow-xl"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150";
                  }}
                />
                <h2 className="text-lg font-extrabold text-white mt-3">{userData?.name || "Dr. WellCare"}</h2>
                <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest mt-1">
                  {userData?.department || userData?.specialization || "General Medicine"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{userData?.qualification || "MBBS, MD"}</p>
              </div>

              {/* Profile Information List */}
              <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Doctor ID</span>
                  <span className="text-cyan-400 font-mono font-bold">{userData?.id || userData?.uid || "DOC-1001"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Doctor Name</span>
                  <span className="text-slate-200 font-semibold">{userData?.name || "Dr. WellCare"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email (Immutable)</span>
                  <span className="text-slate-300 font-semibold">{userData?.email || "doctor@wellcare.com"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Phone Number</span>
                  <span className="text-slate-300 font-semibold">{userData?.mobile || userData?.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="text-slate-300 font-semibold">{userData?.department || userData?.specialization || "General Medicine"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Qualification</span>
                  <span className="text-slate-300 font-semibold">{userData?.qualification || "MBBS, MD"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Hospital Name</span>
                  <span className="text-slate-300 font-semibold">{userData?.hospitalName || "Well Care Hospital"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2">
                  <span className="text-slate-500 font-medium">Created Date</span>
                  <span className="text-slate-400 font-mono text-[11px]">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "2026-07-01"}</span>
                </div>
              </div>

              {/* Edit Profile Toggle Button */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-400 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isEditing ? "Close Form" : "✏️ Edit Profile Details"}
              </button>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          {isEditing && (
            <Card className="bg-slate-900 border-slate-800 animate-slide-in">
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Doctor Full Name</label>
                    <input
                      required
                      placeholder="Dr. John Smith"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Email Address (Immutable)</label>
                    <input
                      disabled
                      type="email"
                      value={userData?.email || ""}
                      className="w-full bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Email is unique and cannot be modified after registration.</p>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Phone Number</label>
                    <input
                      placeholder="+1-555-0199"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Department / Specialization</label>
                    <input
                      placeholder="Cardiology"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Qualification</label>
                    <input
                      placeholder="MBBS, MD, MS"
                      value={editForm.qualification}
                      onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Profile Photo URL</label>
                    <input
                      placeholder="https://example.com/photo.jpg"
                      value={editForm.profilePhoto}
                      onChange={(e) => setEditForm({ ...editForm, profilePhoto: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    {isSavingProfile ? "Saving Profile..." : "Save Modifications"}
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
              <CardTitle>Doctor Clinical Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* StatCards Row */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                  title="My Assigned Patients" 
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
                  title="Critical Cases" 
                  value={stats.criticalCount} 
                  icon="🚨" 
                  color="red" 
                />
                <StatCard 
                  title="Emergency Alerts" 
                  value={stats.alertsCount} 
                  icon="🆘" 
                  color="amber" 
                />
              </div>

              {/* Treatments Section */}
              <div className="border-t border-slate-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Treatment & Prescription Registry
                  </h3>
                  <button
                    onClick={() => setIsAddingTreatment(!isAddingTreatment)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    {isAddingTreatment ? "Cancel" : "+ Add Treatment Record"}
                  </button>
                </div>

                {isAddingTreatment && (
                  <form onSubmit={handleAddTreatment} className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3 mb-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Patient Name</label>
                        <input
                          required
                          placeholder="Aarav Sharma"
                          value={treatmentForm.patientName}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, patientName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Treatment Type</label>
                        <input
                          placeholder="Chemotherapy, Post-Op Care"
                          value={treatmentForm.treatmentType}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, treatmentType: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Diagnosis</label>
                        <input
                          placeholder="Acute Epilepsy"
                          value={treatmentForm.diagnosis}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, diagnosis: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Status</label>
                        <select
                          value={treatmentForm.status}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, status: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-white"
                        >
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingTreatment}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                    >
                      {isSavingTreatment ? "Saving Treatment..." : "Submit Treatment Record"}
                    </button>
                  </form>
                )}

                <DataTable
                  columns={treatmentColumns}
                  data={treatments}
                  emptyMessage="No treatment history recorded for this doctor workspace."
                />
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

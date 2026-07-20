import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { notificationService } from "./notificationService";

const COLLECTION = "patients";

const DEFAULT_PATIENTS = [
  {
    id: "pat_101",
    name: "John Doe",
    age: 45,
    gender: "Male",
    bloodGroup: "O+",
    doctor: "Dr. Rajesh Mehta",
    room: "101",
    contact: "+1-555-0144",
    address: "742 Evergreen Terrace",
    diagnosis: "Cardiac Distress / Arrhythmia",
    history: "History of hypertension and coronary artery disease.",
    status: "Critical",
    riskScore: 88,
    admissionDate: "2026-07-15",
    hospitalId: "WHC-2026-1001",
    vitals: {
      heartRate: 110,
      temperature: 99.1,
      bloodPressure: "140/95",
      oxygenSaturation: 89,
      respiratoryRate: 24
    }
  },
  {
    id: "pat_105",
    name: "Jane Smith",
    age: 32,
    gender: "Female",
    bloodGroup: "A+",
    doctor: "Dr. Rajesh Mehta",
    room: "105",
    contact: "+1-555-0177",
    address: "123 Elm Street",
    diagnosis: "Acute Pneumonia",
    history: "Asthma in childhood, admitted with shortness of breath.",
    status: "Observation",
    riskScore: 45,
    admissionDate: "2026-07-18",
    hospitalId: "WHC-2026-1001",
    vitals: {
      heartRate: 82,
      temperature: 98.6,
      bloodPressure: "120/80",
      oxygenSaturation: 96,
      respiratoryRate: 18
    }
  },
  {
    id: "pat_110",
    name: "Robert Chen",
    age: 58,
    gender: "Male",
    bloodGroup: "B+",
    doctor: "Dr. Anitha Rao",
    room: "110",
    contact: "+1-555-0199",
    address: "456 Oak Lane",
    diagnosis: "Severe Sepsis",
    history: "Post-surgical complication, monitoring vital signs closely.",
    status: "Critical",
    riskScore: 92,
    admissionDate: "2026-07-19",
    hospitalId: "WHC-2026-1001",
    vitals: {
      heartRate: 118,
      temperature: 101.4,
      bloodPressure: "90/60",
      oxygenSaturation: 88,
      respiratoryRate: 26
    }
  },
  {
    id: "pat_201",
    name: "Emily Davis",
    age: 27,
    gender: "Female",
    bloodGroup: "AB+",
    doctor: "Dr. Rajesh Mehta",
    room: "201",
    contact: "+1-555-0122",
    address: "890 Pine Road",
    diagnosis: "Post-op Fractured Femur Recovery",
    history: "No prior chronic illnesses.",
    status: "Stable",
    riskScore: 15,
    admissionDate: "2026-07-17",
    hospitalId: "WHC-2026-1001",
    vitals: {
      heartRate: 72,
      temperature: 98.4,
      bloodPressure: "118/75",
      oxygenSaturation: 99,
      respiratoryRate: 16
    }
  },
  {
    id: "pat_205",
    name: "Michael Brown",
    age: 64,
    gender: "Male",
    bloodGroup: "O-",
    doctor: "Dr. Anitha Rao",
    room: "205",
    contact: "+1-555-0155",
    address: "321 Maple Ave",
    diagnosis: "Hypertension & Diabetes Type II",
    history: "Routine clinical evaluation and vital monitoring.",
    status: "Stable",
    riskScore: 25,
    admissionDate: "2026-07-16",
    hospitalId: "WHC-2026-1001",
    vitals: {
      heartRate: 75,
      temperature: 98.6,
      bloodPressure: "125/82",
      oxygenSaturation: 98,
      respiratoryRate: 16
    }
  }
];

export const patientService = {
  // Retrieve single patient doc
  async getPatient(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.warn("Error fetching patient doc:", e);
    }
    const found = DEFAULT_PATIENTS.find(p => p.id === id);
    if (found) return found;
    return DEFAULT_PATIENTS[0];
  },

  // Listen to patient records real-time
  listenPatients(userRole, hospitalId, assignedPatients, assignedRooms, callback) {
    let q = collection(db, COLLECTION);
    
    // Multi-tenant isolation: filter by hospitalId if not super_admin
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      let patientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply role access restrictions on client side
      if (userRole === "doctor" && assignedPatients && assignedPatients.length > 0) {
        patientList = patientList.filter(p => assignedPatients.includes(p.id) || p.doctor === assignedPatients[0]);
      } else if (userRole === "caregiver" && assignedPatients) {
        patientList = patientList.filter(p => assignedPatients.includes(p.id));
      } else if (userRole === "nurse" && assignedRooms && assignedRooms.length > 0) {
        patientList = patientList.filter(p => assignedRooms.includes(p.room));
      }

      if (patientList.length === 0) {
        patientList = DEFAULT_PATIENTS;
      }

      callback(patientList);
    }, (error) => {
      console.error("Error subscribing to patients:", error);
      callback(DEFAULT_PATIENTS);
    });
  },

  // Listen to critical patients, isolated by hospital tenant
  listenCriticalPatients(hospitalId, callback) {
    const q = query(
      collection(db, "critical_patients"),
      where("hospitalId", "==", hospitalId || "WHC-2026-1001")
    );

    return onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (list.length === 0) {
        list = DEFAULT_PATIENTS.filter(p => p.status === "Critical").map(p => ({
          id: p.id,
          patientId: p.id,
          name: p.name,
          room: p.room,
          doctor: p.doctor,
          hospitalId: p.hospitalId || "WHC-2026-1001",
          vitals: p.vitals,
          diagnosis: p.diagnosis,
          criticalSince: new Date().toISOString()
        }));
      }
      // Sort chronologically descending
      list.sort((a, b) => new Date(b.criticalSince || 0) - new Date(a.criticalSince || 0));
      callback(list);
    }, (error) => {
      console.error("Error subscribing to critical patients:", error);
      const fallback = DEFAULT_PATIENTS.filter(p => p.status === "Critical").map(p => ({
        id: p.id,
        patientId: p.id,
        name: p.name,
        room: p.room,
        doctor: p.doctor,
        hospitalId: p.hospitalId || "WHC-2026-1001",
        vitals: p.vitals,
        diagnosis: p.diagnosis,
        criticalSince: new Date().toISOString()
      }));
      callback(fallback);
    });
  },

  // Create a patient with all standard clinical fields
  async addPatient(patientData, hospitalId) {
    const hId = hospitalId || patientData.hospitalId || "WHC-2026-1001";
    const cleanData = {
      name: patientData.name || "Unknown Patient",
      age: Number(patientData.age) || 0,
      gender: patientData.gender || "Other",
      bloodGroup: patientData.bloodGroup || "O+",
      doctor: patientData.doctor || "Unassigned",
      room: patientData.room || "Unassigned",
      contact: patientData.contact || "N/A",
      address: patientData.address || "N/A",
      diagnosis: patientData.diagnosis || "No Diagnosis",
      history: patientData.history || "",
      status: patientData.status || "Stable",
      riskScore: Number(patientData.riskScore) || 10,
      admissionDate: patientData.admissionDate || new Date().toISOString().split("T")[0],
      hospitalId: hId,
      createdAt: new Date().toISOString(),
      vitals: patientData.vitals || {
        heartRate: 75,
        temperature: 98.6,
        bloodPressure: "120/80",
        oxygenSaturation: 98,
        respiratoryRate: 16
      }
    };
    const docRef = await addDoc(collection(db, COLLECTION), cleanData);
    
    // Add Patient notification
    await notificationService.addNotification(
      "Patient Added",
      `Patient ${cleanData.name} has been admitted.`,
      hId
    );

    // If status is Critical, add to critical_patients
    if (cleanData.status === "Critical") {
      await setDoc(doc(db, "critical_patients", docRef.id), {
        patientId: docRef.id,
        name: cleanData.name,
        room: cleanData.room,
        doctor: cleanData.doctor,
        hospitalId: hId,
        vitals: cleanData.vitals,
        diagnosis: cleanData.diagnosis,
        criticalSince: new Date().toISOString()
      });
      
      await notificationService.addNotification(
        "Critical Patient Created",
        `Patient ${cleanData.name} status is CRITICAL.`,
        hId
      );
    }

    return { id: docRef.id, ...cleanData };
  },

  // Update fields on a patient record
  async updatePatient(id, patientData) {
    const docRef = doc(db, COLLECTION, id);
    
    // Fetch current state
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("Patient not found");
    }
    const currentData = snap.data();
    const prevStatus = currentData.status;
    const hId = currentData.hospitalId || patientData.hospitalId || "WHC-2026-1001";
    
    const updatedData = { ...patientData };
    if (updatedData.age !== undefined) updatedData.age = Number(updatedData.age);
    if (updatedData.riskScore !== undefined) updatedData.riskScore = Number(updatedData.riskScore);
    await updateDoc(docRef, updatedData);
    
    const newStatus = updatedData.status !== undefined ? updatedData.status : prevStatus;
    
    // If status is Critical
    if (newStatus === "Critical") {
      await setDoc(doc(db, "critical_patients", id), {
        patientId: id,
        name: updatedData.name || currentData.name || "Unknown Patient",
        room: updatedData.room || currentData.room || "Unassigned",
        doctor: updatedData.doctor || currentData.doctor || "Unassigned",
        hospitalId: hId,
        vitals: updatedData.vitals || currentData.vitals || null,
        diagnosis: updatedData.diagnosis || currentData.diagnosis || "Critical",
        criticalSince: currentData.criticalSince || new Date().toISOString()
      });
      
      if (prevStatus !== "Critical") {
        await notificationService.addNotification(
          "Critical Patient Created",
          `Patient ${updatedData.name || currentData.name || "Unknown Patient"} status changed to CRITICAL.`,
          hId
        );
      }
    } 
    // If status was Critical and changed to something else
    else if (prevStatus === "Critical" && newStatus !== "Critical") {
      await deleteDoc(doc(db, "critical_patients", id));
    }
    
    // Add Patient Updated notification
    await notificationService.addNotification(
      "Patient Updated",
      `Patient ${updatedData.name || currentData.name || "Unknown Patient"} records updated.`,
      hId
    );
  },

  // Delete patient document
  async deletePatient(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
    try {
      await deleteDoc(doc(db, "critical_patients", id));
    } catch (e) {
      console.warn("Error removing deleted patient from critical list:", e);
    }
  }
};

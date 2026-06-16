import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "patients";

export const patientService = {
  // Retrieve single patient doc
  async getPatient(id) {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error("Patient document not found");
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

      callback(patientList);
    }, (error) => {
      console.error("Error subscribing to patients:", error);
    });
  },

  // Create a patient with all standard clinical fields
  async addPatient(patientData, hospitalId) {
    const cleanData = {
      name: patientData.name || "Unknown Patient",
      age: Number(patientData.age) || 0,
      gender: patientData.gender || "Other",
      bloodGroup: patientData.bloodGroup || "O+",
      doctor: patientData.doctor || "Unassigned",
      room: patientData.room || "Unassigned",
      contact: patientData.contact || "N/A",
      diagnosis: patientData.diagnosis || "No Diagnosis",
      history: patientData.history || "",
      status: patientData.status || "Stable",
      riskScore: Number(patientData.riskScore) || 10,
      admissionDate: patientData.admissionDate || new Date().toISOString().split("T")[0],
      hospitalId: hospitalId || "hosp_default",
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
    return { id: docRef.id, ...cleanData };
  },

  // Update fields on a patient record
  async updatePatient(id, patientData) {
    const docRef = doc(db, COLLECTION, id);
    const updatedData = { ...patientData };
    if (updatedData.age !== undefined) updatedData.age = Number(updatedData.age);
    if (updatedData.riskScore !== undefined) updatedData.riskScore = Number(updatedData.riskScore);
    await updateDoc(docRef, updatedData);
  },

  // Delete patient document
  async deletePatient(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};

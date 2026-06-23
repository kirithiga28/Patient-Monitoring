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

  // Listen to critical patients, isolated by hospital tenant
  listenCriticalPatients(hospitalId, callback) {
    const q = query(
      collection(db, "critical_patients"),
      where("hospitalId", "==", hospitalId || "WHC-2026-1001")
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort chronologically descending
      list.sort((a, b) => new Date(b.criticalSince || 0) - new Date(a.criticalSince || 0));
      callback(list);
    }, (error) => {
      console.error("Error subscribing to critical patients:", error);
      callback([]);
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

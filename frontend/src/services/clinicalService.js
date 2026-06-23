import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { notificationService } from "./notificationService";

const ADMISSIONS = "admissions";
const DISCHARGES = "discharges";
const TRANSFERS = "transfers";
const PRESCRIPTIONS = "prescriptions";
const LAB_REPORTS = "lab_reports";
const SCAN_REPORTS = "scan_reports";
const MEDICAL_RECORDS = "medical_records";

export const clinicalService = {
  // 1. Patient Admissions
  listenAdmissions(hospitalId, callback) {
    const q = query(collection(db, ADMISSIONS), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addAdmission(data) {
    return addDoc(collection(db, ADMISSIONS), { ...data, timestamp: serverTimestamp() });
  },

  // 2. Discharges
  listenDischarges(hospitalId, callback) {
    const q = query(collection(db, DISCHARGES), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addDischarge(data) {
    return addDoc(collection(db, DISCHARGES), { ...data, timestamp: serverTimestamp() });
  },

  // 3. Transfers
  listenTransfers(hospitalId, callback) {
    const q = query(collection(db, TRANSFERS), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addTransfer(data) {
    return addDoc(collection(db, TRANSFERS), { ...data, timestamp: serverTimestamp() });
  },

  // 4. Prescriptions
  listenPrescriptions(hospitalId, callback) {
    const q = query(collection(db, PRESCRIPTIONS), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addPrescription(data) {
    return addDoc(collection(db, PRESCRIPTIONS), { ...data, timestamp: serverTimestamp() });
  },

  // 5. Lab Reports
  listenLabReports(hospitalId, callback) {
    const q = query(collection(db, LAB_REPORTS), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addLabReport(data) {
    return addDoc(collection(db, LAB_REPORTS), { ...data, timestamp: serverTimestamp() });
  },

  // 6. Scan Reports
  listenScanReports(hospitalId, callback) {
    const q = query(collection(db, SCAN_REPORTS), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addScanReport(data) {
    return addDoc(collection(db, SCAN_REPORTS), { ...data, timestamp: serverTimestamp() });
  },

  // 7. Medical Records CRUD (Dynamic clinical entries)
  listenMedicalRecords(patientId, callback) {
    if (!patientId) return () => {};
    const q = query(collection(db, MEDICAL_RECORDS), where("patientId", "==", patientId));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort chronologically client-side to prevent indexing issues
      list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      callback(list);
    }, (error) => {
      console.error("Error listening to medical records:", error);
      callback([]);
    });
  },
  async addMedicalRecord(data) {
    const docRef = await addDoc(collection(db, MEDICAL_RECORDS), {
      ...data,
      createdAt: new Date().toISOString()
    });
    
    // Fetch patient name if possible
    let patientName = data.patientName || data.patientId || "Unknown Patient";
    if (data.patientId && !data.patientName) {
      try {
        const patientDoc = await getDoc(doc(db, "patients", data.patientId));
        if (patientDoc.exists()) {
          patientName = patientDoc.data().name;
        }
      } catch (e) {
        console.warn("Could not fetch patient name for medical record notification:", e);
      }
    }
    
    await notificationService.addNotification(
      "Medical Record Updated",
      `Medical record added for patient ${patientName}.`,
      data.hospitalId || "WHC-2026-1001"
    );
    
    return docRef;
  },
  async updateMedicalRecord(id, data) {
    await updateDoc(doc(db, MEDICAL_RECORDS, id), data);
    
    let hospitalId = data.hospitalId;
    let patientName = data.patientName || data.patientId;
    try {
      const recDoc = await getDoc(doc(db, MEDICAL_RECORDS, id));
      if (recDoc.exists()) {
        const recData = recDoc.data();
        hospitalId = hospitalId || recData.hospitalId;
        const patientId = recData.patientId;
        if (patientId) {
          const patientDoc = await getDoc(doc(db, "patients", patientId));
          if (patientDoc.exists()) {
            patientName = patientDoc.data().name;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch medical record details for notification:", e);
    }
    
    await notificationService.addNotification(
      "Medical Record Updated",
      `Medical record updated for patient ${patientName || "Unknown"}.`,
      hospitalId || "WHC-2026-1001"
    );
  },
  async deleteMedicalRecord(id) {
    return deleteDoc(doc(db, MEDICAL_RECORDS, id));
  }
};

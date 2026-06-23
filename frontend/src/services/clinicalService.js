import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

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
    return addDoc(collection(db, MEDICAL_RECORDS), {
      ...data,
      createdAt: new Date().toISOString()
    });
  },
  async updateMedicalRecord(id, data) {
    return updateDoc(doc(db, MEDICAL_RECORDS, id), data);
  },
  async deleteMedicalRecord(id) {
    return deleteDoc(doc(db, MEDICAL_RECORDS, id));
  }
};

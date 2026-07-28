import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/config";
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
    }, (error) => {
      console.error("Error listening to admissions:", error);
      callback([]);
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
    }, (error) => {
      console.error("Error listening to discharges:", error);
      callback([]);
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
    }, (error) => {
      console.error("Error listening to transfers:", error);
      callback([]);
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
    }, (error) => {
      console.error("Error listening to prescriptions:", error);
      callback([]);
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
    }, (error) => {
      console.error("Error listening to lab reports:", error);
      callback([]);
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
    }, (error) => {
      console.error("Error listening to scan reports:", error);
      callback([]);
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
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";

      const res = await fetch(`http://localhost:5000/api/patients/${data.patientId}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error("Failed to save medical record.");
      }

      const d = await res.json();
      
      // Send notification
      let patientName = data.patientName || data.patientId || "Unknown Patient";
      await notificationService.addNotification(
        "Medical Record Updated",
        `Medical record added for patient ${patientName}.`,
        data.hospitalId || "WHC-2026-1001"
      );

      return d.record;
    } catch (err) {
      console.error("Error adding medical record:", err);
      throw err;
    }
  },
  async updateMedicalRecord(id, data) {
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";

      const res = await fetch(`http://localhost:5000/api/medical-records/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error("Failed to update medical record.");
      }

      const d = await res.json();

      let patientName = data.patientName || data.patientId || "Unknown Patient";
      await notificationService.addNotification(
        "Medical Record Updated",
        `Medical record updated for patient ${patientName}.`,
        data.hospitalId || "WHC-2026-1001"
      );

      return d.record;
    } catch (err) {
      console.error("Error updating medical record:", err);
      throw err;
    }
  },
  async deleteMedicalRecord(id) {
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";

      const res = await fetch(`http://localhost:5000/api/medical-records/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete medical record.");
      }
    } catch (err) {
      console.error("Error deleting medical record:", err);
      throw err;
    }
  }
};

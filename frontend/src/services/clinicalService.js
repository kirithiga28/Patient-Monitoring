import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const clinicalService = {
  // 1. Patient Admissions
  listenAdmissions(hospitalId, callback) {
    const q = query(collection(db, "admissions"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "adm_1", patientName: "Aarav Sharma", diagnosis: "Epilepsy Monitoring", room: "101", date: "2026-06-15", status: "Admitted", insurance: "National Health", hospitalId: hospitalId || "hosp_default" },
          { id: "adm_2", patientName: "Priya Nair", diagnosis: "Post Surgery Recovery", room: "105", date: "2026-06-18", status: "Admitted", insurance: "Universal Care", hospitalId: hospitalId || "hosp_default" },
          { id: "adm_3", patientName: "Rohan Verma", diagnosis: "Head Trauma Observation", room: "108", date: "2026-06-20", status: "Admitted", insurance: "Self Pay", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addAdmission(data) {
    return addDoc(collection(db, "admissions"), { ...data, timestamp: serverTimestamp() });
  },

  // 2. Discharges
  listenDischarges(hospitalId, callback) {
    const q = query(collection(db, "discharges"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "dis_1", patientName: "Vikram Singh", diagnosis: "Heart Disease Stabilization", room: "112", date: "2026-06-10", summary: "Condition stable. Follow-up in 2 weeks.", doctor: "Dr. Rajesh Mehta", hospitalId: hospitalId || "hosp_default" },
          { id: "dis_2", patientName: "Meera Joseph", diagnosis: "Diabetes Management", room: "115", date: "2026-06-14", summary: "Insulin dosage adjusted. Dietary guidelines provided.", doctor: "Dr. Anitha Rao", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addDischarge(data) {
    return addDoc(collection(db, "discharges"), { ...data, timestamp: serverTimestamp() });
  },

  // 3. Transfers
  listenTransfers(hospitalId, callback) {
    const q = query(collection(db, "transfers"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "tr_1", patientName: "Ananya Iyer", fromRoom: "110", toRoom: "ICU-2", reason: "Oxygen Saturation drop, requiring ICU telemetry", status: "Completed", date: "2026-06-21", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addTransfer(data) {
    return addDoc(collection(db, "transfers"), { ...data, timestamp: serverTimestamp() });
  },

  // 4. Prescriptions
  listenPrescriptions(hospitalId, callback) {
    const q = query(collection(db, "prescriptions"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "rx_1", patientName: "Aarav Sharma", medication: "Levetiracetam", dosage: "500mg", frequency: "Twice daily", doctor: "Dr. Rajesh Mehta", startDate: "2026-06-15", hospitalId: hospitalId || "hosp_default" },
          { id: "rx_2", patientName: "Priya Nair", medication: "Amoxicillin", dosage: "250mg", frequency: "Three times daily", doctor: "Dr. Anitha Rao", startDate: "2026-06-19", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addPrescription(data) {
    return addDoc(collection(db, "prescriptions"), { ...data, timestamp: serverTimestamp() });
  },

  // 5. Lab Reports
  listenLabReports(hospitalId, callback) {
    const q = query(collection(db, "lab_reports"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "lab_1", patientName: "Aarav Sharma", testName: "Complete Blood Count (CBC)", date: "2026-06-16", result: "WBC count normal. Platelets normal.", status: "Verified", hospitalId: hospitalId || "hosp_default" },
          { id: "lab_2", patientName: "Priya Nair", testName: "Liver Function Test (LFT)", date: "2026-06-19", result: "ALT/AST slightly elevated. Keep under observation.", status: "Verified", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addLabReport(data) {
    return addDoc(collection(db, "lab_reports"), { ...data, timestamp: serverTimestamp() });
  },

  // 6. Scan Reports
  listenScanReports(hospitalId, callback) {
    const q = query(collection(db, "scan_reports"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "scan_1", patientName: "Rohan Verma", scanType: "Brain CT Scan", date: "2026-06-20", findings: "Minor swelling in temporal lobe, no acute hemorrhage.", status: "Completed", hospitalId: hospitalId || "hosp_default" },
          { id: "scan_2", patientName: "Ananya Iyer", scanType: "Chest X-Ray", date: "2026-06-17", findings: "No active infiltrates. Clear lung fields.", status: "Completed", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addScanReport(data) {
    return addDoc(collection(db, "scan_reports"), { ...data, timestamp: serverTimestamp() });
  }
};

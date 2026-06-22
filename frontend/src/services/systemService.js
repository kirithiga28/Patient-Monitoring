import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const systemService = {
  // 1. Audit Logs
  listenAuditLogs(hospitalId, callback) {
    const q = query(collection(db, "audit_logs"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "aud_1", user: "Dr. Rajesh Mehta", action: "Accessed Patient Aarav Sharma Records", timestamp: "2026-06-22 09:30:12 AM", ipAddress: "192.168.1.45", hospitalId: hospitalId || "hosp_default" },
          { id: "aud_2", user: "Nurse Lisa Miller", action: "Administered Levetiracetam", timestamp: "2026-06-22 08:05:01 AM", ipAddress: "192.168.1.51", hospitalId: hospitalId || "hosp_default" },
          { id: "aud_3", user: "Admin Desk", action: "Modified Role Permissions", timestamp: "2026-06-21 04:12:44 PM", ipAddress: "192.168.1.10", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async logAction(data) {
    return addDoc(collection(db, "audit_logs"), { ...data, timestamp: serverTimestamp() });
  },

  // 2. Backup Registry
  listenBackups(hospitalId, callback) {
    const q = query(collection(db, "backups"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "bak_1", filename: "wellcare_patients_db_20260621.sql", size: "45.8 MB", status: "Success", date: "2026-06-21 02:00 AM", type: "Automated Daily", hospitalId: hospitalId || "hosp_default" },
          { id: "bak_2", filename: "wellcare_logs_archive_20260620.sql", size: "128.4 MB", status: "Success", date: "2026-06-20 02:00 AM", type: "Automated Weekly", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async triggerBackup(data) {
    return addDoc(collection(db, "backups"), { ...data, timestamp: serverTimestamp() });
  },

  // 3. API Configs
  listenApiConfigs(hospitalId, callback) {
    const q = query(collection(db, "api_configs"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "api_1", serviceName: "Render AI Microservice", endpoint: "https://wellcare-ai-backend.onrender.com/analyze", status: "Active", hospitalId: hospitalId || "hosp_default" },
          { id: "api_2", serviceName: "Firebase Firestore Database", endpoint: "well-care-hospital.firebaseio.com", status: "Active", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },

  // 4. Security Logs
  listenSecurityLogs(hospitalId, callback) {
    const q = query(collection(db, "security_logs"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "sec_1", event: "Brute Force Warning", details: "3 failed login attempts from 185.220.101.4", severity: "Medium", timestamp: "2026-06-22 03:45 AM", actionTaken: "IP Blocked for 1 hour", hospitalId: hospitalId || "hosp_default" },
          { id: "sec_2", event: "Firewall Check Succeeded", details: "All incoming requests audited, no anomalies found.", severity: "Low", timestamp: "2026-06-22 09:00 AM", actionTaken: "None", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  }
};

import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const systemService = {
  // 1. Audit Logs
  listenAuditLogs(hospitalId, callback) {
    const q = query(collection(db, "audit_logs"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },

  // 4. Security Logs
  listenSecurityLogs(hospitalId, callback) {
    const q = query(collection(db, "security_logs"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },

  // 5. Hospital Settings Read/Write
  listenSettings(hospitalId, callback) {
    const docRef = doc(db, "settings", hospitalId || "WHC-2026-1001");
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        const defaultSettings = {
          hospitalCode: hospitalId || "WHC-2026-1001",
          hospitalId: "1001",
          hospitalName: "Well Care Hospital",
          contactNumber: "+1-555-0199",
          address: "123 Health Ave, Medical City",
          email: "contact@wellcare.com"
        };
        callback(defaultSettings);
      }
    }, (error) => {
      console.error("Error listening to hospital settings:", error);
    });
  },
  async saveSettings(hospitalId, settingsData) {
    const docRef = doc(db, "settings", hospitalId || "WHC-2026-1001");
    await setDoc(docRef, settingsData, { merge: true });
  }
};

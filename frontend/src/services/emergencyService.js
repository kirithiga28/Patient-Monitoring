import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const emergencyService = {
  // 1. Code Blue Alerts (Emergency alerts tracked in backend)
  listenCodeBlue(hospitalId, callback) {
    const q = query(collection(db, "code_blue"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async triggerCodeBlue(data) {
    return addDoc(collection(db, "code_blue"), { ...data, timestamp: serverTimestamp() });
  },
  async updateCodeBlue(id, data) {
    return updateDoc(doc(db, "code_blue", id), data);
  }
};

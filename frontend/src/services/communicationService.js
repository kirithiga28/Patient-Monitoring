import { collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const communicationService = {
  // 1. Messaging channels / Chats
  listenMessages(hospitalId, callback) {
    const q = query(
      collection(db, "messages"),
      where("hospitalId", "==", hospitalId || "hosp_default"),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side in case timestamp index is not yet built
      list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      if (list.length === 0) {
        list = [
          { id: "msg_1", sender: "Dr. Rajesh Mehta", text: "Has anyone completed the rounding for Room 101?", time: "2026-06-22 09:30 AM", hospitalId: hospitalId || "hosp_default" },
          { id: "msg_2", sender: "Nurse Lisa Miller", text: "Yes Dr. Rajesh, Aarav is stable. Meds administered.", time: "2026-06-22 09:35 AM", hospitalId: hospitalId || "hosp_default" },
          { id: "msg_3", sender: "Dr. Anitha Rao", text: "Perfect. Please verify if Room 105 camera telemetry is active.", time: "2026-06-22 09:40 AM", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async sendMessage(data) {
    return addDoc(collection(db, "messages"), {
      ...data,
      timestamp: serverTimestamp(),
      time: new Date().toLocaleTimeString()
    });
  },

  // 2. Announcements
  listenAnnouncements(hospitalId, callback) {
    const q = query(collection(db, "announcements"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "ann_1", title: "Standard Operating Procedure Update", content: "All ICU room transfers must now be logged on the Admission Desk screen immediately.", date: "2026-06-21", author: "Medical Director", hospitalId: hospitalId || "hosp_default" },
          { id: "ann_2", title: "AI Calibration Testing", content: "Calibration drills will take place this Thursday at 2 PM. Please ensure camera streams are active.", date: "2026-06-22", author: "AI Operations Team", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addAnnouncement(data) {
    return addDoc(collection(db, "announcements"), { ...data, timestamp: serverTimestamp() });
  }
};

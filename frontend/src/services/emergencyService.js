import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const emergencyService = {
  // 1. Code Blue Alerts
  listenCodeBlue(hospitalId, callback) {
    const q = query(collection(db, "code_blue"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "cb_1", location: "ICU Ward Bed 3", responseTeam: "Critical Care Team A", startTime: "2026-06-22 09:12 AM", duration: "12 mins", status: "Resolved", notes: "Patient resuscitated, heart rate stabilized.", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async triggerCodeBlue(data) {
    return addDoc(collection(db, "code_blue"), { ...data, timestamp: serverTimestamp() });
  },
  async updateCodeBlue(id, data) {
    return updateDoc(doc(db, "code_blue", id), data);
  },

  // 2. Ambulance Coordinator
  listenAmbulances(hospitalId, callback) {
    const q = query(collection(db, "ambulances"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "amb_1", vehicleNumber: "AMB-101", driver: "Karan Johar", currentLocation: "Market Road, 2km away", ETA: "5 mins", destination: "Emergency Room A", status: "En Route", hospitalId: hospitalId || "hosp_default" },
          { id: "amb_2", vehicleNumber: "AMB-205", driver: "Mohan Lal", currentLocation: "Hospital Bay", ETA: "--", destination: "--", status: "Standby", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addAmbulance(data) {
    return addDoc(collection(db, "ambulances"), { ...data, timestamp: serverTimestamp() });
  },
  async updateAmbulance(id, data) {
    return updateDoc(doc(db, "ambulances", id), data);
  }
};

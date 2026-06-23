import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const staffService = {
  // 1. Doctor Schedule
  listenSchedules(hospitalId, callback) {
    const q = query(collection(db, "schedules"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },

  // 2. Doctor Appointments
  listenAppointments(hospitalId, callback) {
    const q = query(collection(db, "appointments"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addAppointment(data) {
    return addDoc(collection(db, "appointments"), { ...data, timestamp: serverTimestamp() });
  },

  // 3. Nurse Shifts
  listenShifts(hospitalId, callback) {
    const q = query(collection(db, "shifts"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addShift(data) {
    return addDoc(collection(db, "shifts"), { ...data, timestamp: serverTimestamp() });
  },

  // 4. Medication Administration Record (MAR)
  listenMAR(hospitalId, callback) {
    const q = query(collection(db, "mar_records"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    });
  },
  async addMAR(data) {
    return addDoc(collection(db, "mar_records"), { ...data, timestamp: serverTimestamp() });
  }
};

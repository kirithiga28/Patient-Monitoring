import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const staffService = {
  // 1. Doctor Schedule
  listenSchedules(hospitalId, callback) {
    const q = query(collection(db, "schedules"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "sch_1", name: "Dr. Rajesh Mehta", day: "Monday - Friday", hours: "09:00 AM - 05:00 PM", department: "Cardiology", status: "Active", hospitalId: hospitalId || "hosp_default" },
          { id: "sch_2", name: "Dr. Vivek Kumar", day: "Tuesday - Saturday", hours: "10:00 AM - 06:00 PM", department: "Neurology", status: "Active", hospitalId: hospitalId || "hosp_default" },
          { id: "sch_3", name: "Dr. Anitha Rao", day: "Monday, Wednesday, Friday", hours: "08:00 AM - 04:00 PM", department: "ICU Surgery", status: "On Call", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },

  // 2. Doctor Appointments
  listenAppointments(hospitalId, callback) {
    const q = query(collection(db, "appointments"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "app_1", patientName: "Vikram Singh", doctorName: "Dr. Rajesh Mehta", time: "2026-06-23 10:30 AM", reason: "Cardiac ECG follow-up", status: "Scheduled", hospitalId: hospitalId || "hosp_default" },
          { id: "app_2", patientName: "Aarav Sharma", doctorName: "Dr. Vivek Kumar", time: "2026-06-23 11:15 AM", reason: "Post-seizure review", status: "Scheduled", hospitalId: hospitalId || "hosp_default" }
        ];
      }
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
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "sh_1", staffName: "Nurse Lisa Miller", shiftType: "Morning Shift (07:00 AM - 03:00 PM)", unit: "ICU Ward 1", date: "2026-06-22", status: "Checked In", hospitalId: hospitalId || "hosp_default" },
          { id: "sh_2", staffName: "Nurse Sarah Jenkins", shiftType: "Night Shift (11:00 PM - 07:00 AM)", unit: "Cardiology Unit 2", date: "2026-06-22", status: "Scheduled", hospitalId: hospitalId || "hosp_default" }
        ];
      }
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
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "mar_1", patientName: "Aarav Sharma", medication: "Levetiracetam", dosage: "500mg", route: "Oral", timeScheduled: "08:00 AM", status: "Administered", nurseName: "Nurse Lisa Miller", timeAdministered: "2026-06-22 08:05 AM", hospitalId: hospitalId || "hosp_default" },
          { id: "mar_2", patientName: "Priya Nair", medication: "Amoxicillin", dosage: "250mg", route: "Oral", timeScheduled: "12:00 PM", status: "Scheduled", nurseName: "Nurse Sarah Jenkins", timeAdministered: "--", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addMAR(data) {
    return addDoc(collection(db, "mar_records"), { ...data, timestamp: serverTimestamp() });
  }
};

import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

// Setup standard Firestore listeners with static mock fallbacks
export const adminService = {
  // 1. Hospital Configs
  listenHospitals(hospitalId, callback) {
    const q = query(collection(db, "hospitals"), where("id", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [{ id: "hosp_default", name: "Well Care City Hospital", address: "100 Medical Center Way", phone: "+1 (555) 123-4567", status: "Active" }];
      }
      callback(list);
    });
  },

  // 2. Departments
  listenDepartments(hospitalId, callback) {
    const q = query(collection(db, "departments"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "dept_cardio", name: "Cardiology", code: "CAR-01", head: "Dr. Rajesh Mehta", beds: 20, status: "Operational", hospitalId: hospitalId || "hosp_default" },
          { id: "dept_neuro", name: "Neurology", code: "NEU-02", head: "Dr. Vivek Kumar", beds: 15, status: "Operational", hospitalId: hospitalId || "hosp_default" },
          { id: "dept_icu", name: "Intensive Care Unit (ICU)", code: "ICU-03", head: "Dr. Anitha Rao", beds: 10, status: "Under Capacity", hospitalId: hospitalId || "hosp_default" },
          { id: "dept_ortho", name: "Orthopedics", code: "ORT-04", head: "Dr. Ajay", beds: 25, status: "Operational", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addDepartment(data) {
    return addDoc(collection(db, "departments"), data);
  },
  async updateDepartment(id, data) {
    return updateDoc(doc(db, "departments", id), data);
  },

  // 3. Rooms
  listenRooms(hospitalId, callback) {
    const q = query(collection(db, "rooms"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "room_101", roomNumber: "101", department: "Neurology", type: "ICU Isolation", status: "Occupied", hospitalId: hospitalId || "hosp_default" },
          { id: "room_105", roomNumber: "105", department: "Cardiology", type: "Standard Semi-Private", status: "Occupied", hospitalId: hospitalId || "hosp_default" },
          { id: "room_108", roomNumber: "108", department: "Neurology", type: "Private Suite", status: "Occupied", hospitalId: hospitalId || "hosp_default" },
          { id: "room_110", roomNumber: "110", department: "Intensive Care Unit", type: "ICU Ward", status: "Occupied", hospitalId: hospitalId || "hosp_default" },
          { id: "room_201", roomNumber: "201", department: "Orthopedics", type: "Private Suite", status: "Available", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addRoom(data) {
    return addDoc(collection(db, "rooms"), data);
  },
  async updateRoom(id, data) {
    return updateDoc(doc(db, "rooms", id), data);
  },

  // 4. Beds
  listenBeds(hospitalId, callback) {
    const q = query(collection(db, "beds"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "bed_101_a", bedCode: "101-A", roomNumber: "101", department: "Neurology", type: "Electronic Telemetry", status: "Occupied", hospitalId: hospitalId || "hosp_default" },
          { id: "bed_105_a", bedCode: "105-A", roomNumber: "105", department: "Cardiology", type: "Standard Adjustable", status: "Occupied", hospitalId: hospitalId || "hosp_default" },
          { id: "bed_108_a", bedCode: "108-A", roomNumber: "108", department: "Neurology", type: "Pressure-Relief Air", status: "Occupied", hospitalId: hospitalId || "hosp_default" },
          { id: "bed_201_a", bedCode: "201-A", roomNumber: "201", department: "Orthopedics", type: "Standard Adjustable", status: "Available", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async addBed(data) {
    return addDoc(collection(db, "beds"), data);
  },
  async updateBed(id, data) {
    return updateDoc(doc(db, "beds", id), data);
  },

  // 5. Users
  listenUsers(hospitalId, callback) {
    const q = query(collection(db, "users"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "u_rajesh", name: "Dr. Rajesh Mehta", email: "rajesh@wellcare.com", role: "doctor", status: "Active", hospitalId: hospitalId || "hosp_default" },
          { id: "u_anitha", name: "Dr. Anitha Rao", email: "anitha@wellcare.com", role: "doctor", status: "Active", hospitalId: hospitalId || "hosp_default" },
          { id: "u_lisa", name: "Nurse Lisa Miller", email: "lisa@wellcare.com", role: "nurse", status: "Active", hospitalId: hospitalId || "hosp_default" },
          { id: "u_sarah", name: "Nurse Sarah Jenkins", email: "sarah@wellcare.com", role: "nurse", status: "Active", hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async updateUser(id, data) {
    return updateDoc(doc(db, "users", id), data);
  },

  // 6. Role Permissions
  listenPermissions(hospitalId, callback) {
    const q = query(collection(db, "role_permissions"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (list.length === 0) {
        list = [
          { id: "rp_admin", role: "hospital_admin", modules: { admin: true, clinical: true, staff: true, ai: true, emergency: true, analytics: true }, hospitalId: hospitalId || "hosp_default" },
          { id: "rp_doctor", role: "doctor", modules: { admin: false, clinical: true, staff: true, ai: true, emergency: true, analytics: true }, hospitalId: hospitalId || "hosp_default" },
          { id: "rp_nurse", role: "nurse", modules: { admin: false, clinical: true, staff: true, ai: true, emergency: true, analytics: false }, hospitalId: hospitalId || "hosp_default" }
        ];
      }
      callback(list);
    });
  },
  async updatePermissions(id, data) {
    return updateDoc(doc(db, "role_permissions", id), data);
  }
};

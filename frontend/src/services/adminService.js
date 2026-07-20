import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

// Setup standard Firestore listeners with static mock fallbacks
export const adminService = {
  // 1. Hospital Configs
  listenHospitals(hospitalId, callback) {
    const q = query(collection(db, "hospitals"), where("id", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    }, (error) => {
      console.error("Error listening to hospitals:", error);
      callback([]);
    });
  },

  // 2. Departments
  listenDepartments(hospitalId, callback) {
    const q = query(collection(db, "departments"), where("hospitalId", "==", hospitalId || "hosp_default"));
    return onSnapshot(q, (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(list);
    }, (error) => {
      console.error("Error listening to departments:", error);
      callback([]);
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
      callback(list);
    }, (error) => {
      console.error("Error listening to rooms:", error);
      callback([]);
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
      callback(list);
    }, (error) => {
      console.error("Error listening to beds:", error);
      callback([]);
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
      callback(list);
    }, (error) => {
      console.error("Error listening to users:", error);
      callback([]);
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
      callback(list);
    }, (error) => {
      console.error("Error listening to permissions:", error);
      callback([]);
    });
  },
  async updatePermissions(id, data) {
    return updateDoc(doc(db, "role_permissions", id), data);
  }
};

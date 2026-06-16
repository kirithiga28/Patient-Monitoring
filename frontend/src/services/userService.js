import { 
  collection, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "users";

export const userService = {
  // Listen to users of the hospital
  listenUsers(userRole, hospitalId, callback) {
    let q = collection(db, COLLECTION);
    
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(usersList);
    }, (error) => {
      console.error("Error listening to users:", error);
    });
  },

  // Save/register user profile details
  async saveUserProfile(userId, userData) {
    const docRef = doc(db, COLLECTION, userId);
    await setDoc(docRef, {
      uid: userId,
      ...userData,
      createdAt: new Date().toISOString()
    }, { merge: true });
  },

  // Register hospital details if it's a new tenant
  async registerHospitalTenant(hospitalId, hospitalName) {
    const docRef = doc(db, "hospitals", hospitalId);
    await setDoc(docRef, {
      id: hospitalId,
      name: hospitalId === "hosp_default" ? "Well Care City Hospital" : hospitalName,
      createdAt: new Date().toISOString()
    }, { merge: true });
  },

  // Update user profile fields
  async updateUser(userId, userData) {
    const docRef = doc(db, COLLECTION, userId);
    await updateDoc(docRef, userData);
  },

  // Delete user profile document
  async deleteUser(userId) {
    const docRef = doc(db, COLLECTION, userId);
    await deleteDoc(docRef);
  }
};

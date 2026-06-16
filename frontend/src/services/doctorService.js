import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "doctors";

export const doctorService = {
  // Listen to doctor lists
  listenDoctors(userRole, hospitalId, callback) {
    let q = collection(db, COLLECTION);
    
    // Scoped isolation
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      const doctorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(doctorsList);
    }, (error) => {
      console.error("Error listening to doctors:", error);
    });
  },

  // Add doctor document
  async addDoctor(doctorData, hospitalId) {
    const cleanData = {
      name: doctorData.name || "Unknown Doctor",
      specialization: doctorData.specialization || "General Medicine",
      email: doctorData.email || "",
      phone: doctorData.phone || "N/A",
      experience: Number(doctorData.experience) || 0,
      assignedPatients: doctorData.assignedPatients || [],
      hospitalId: hospitalId || "hosp_default",
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, COLLECTION), cleanData);
    return { id: docRef.id, ...cleanData };
  },

  // Update doctor details
  async updateDoctor(id, doctorData) {
    const docRef = doc(db, COLLECTION, id);
    const updatedData = { ...doctorData };
    if (updatedData.experience !== undefined) {
      updatedData.experience = Number(updatedData.experience);
    }
    await updateDoc(docRef, updatedData);
  },

  // Delete doctor details
  async deleteDoctor(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};

import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "treatments";

export const treatmentService = {
  // Listen to treatments in real-time, isolated by Doctor UID
  listenTreatments(doctorId, callback) {
    if (!doctorId) return () => {};
    const q = query(
      collection(db, COLLECTION),
      where("doctorId", "==", doctorId)
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort client-side
      list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      callback(list);
    }, (error) => {
      console.error("Error listening to treatments:", error);
      callback([]);
    });
  },

  // Save a new treatment record
  async addTreatment(treatmentData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        patientName: treatmentData.patientName || "Unknown Patient",
        treatmentType: treatmentData.treatmentType || "General Care",
        diagnosis: treatmentData.diagnosis || "N/A",
        date: treatmentData.date || new Date().toISOString().split("T")[0],
        status: treatmentData.status || "Ongoing",
        doctorId: treatmentData.doctorId,
        hospitalId: treatmentData.hospitalId || "WHC-2026-1001",
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...treatmentData };
    } catch (err) {
      console.error("Error adding treatment record:", err);
      throw err;
    }
  }
};

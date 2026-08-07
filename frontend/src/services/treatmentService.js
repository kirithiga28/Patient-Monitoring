import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { API_BASE_URL as BACKEND_URL } from "../config/api";

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

  // Save a new treatment record via Node.js API
  async addTreatment(treatmentData) {
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";

      const res = await fetch(`${BACKEND_URL}/api/treatments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(treatmentData)
      });

      if (!res.ok) {
        let msg = "Failed to save treatment record.";
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();
      return data.treatment;
    } catch (err) {
      console.error("Error adding treatment record:", err);
      throw err;
    }
  }
};

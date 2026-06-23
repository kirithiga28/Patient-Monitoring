import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "notifications";

export const notificationService = {
  // Listen to notifications in real-time, isolated by hospital tenant
  listenNotifications(hospitalId, callback) {
    const q = query(
      collection(db, COLLECTION),
      where("hospitalId", "==", hospitalId || "WHC-2026-1001")
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort chronologically descending client-side
      list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      callback(list);
    }, (error) => {
      console.error("Error listening to notifications:", error);
      callback([]);
    });
  },

  // Add a new notification
  async addNotification(type, message, hospitalId) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        type,
        message,
        hospitalId: hospitalId || "WHC-2026-1001",
        timestamp: new Date().toISOString()
      });
      return { id: docRef.id };
    } catch (err) {
      console.error("Error adding notification:", err);
      throw err;
    }
  }
};

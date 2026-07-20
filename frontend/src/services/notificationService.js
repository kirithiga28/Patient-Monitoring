import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "notifications";

const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif_1",
    type: "Emergency Alert Created",
    message: "Emergency Alert (Cardiac Distress) raised for patient John Doe.",
    hospitalId: "WHC-2026-1001",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: "notif_2",
    type: "Critical Patient Created",
    message: "Patient Robert Chen status changed to CRITICAL.",
    hospitalId: "WHC-2026-1001",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: "notif_3",
    type: "Vital Signs Updated",
    message: "Vital signs updated for patient Jane Smith.",
    hospitalId: "WHC-2026-1001",
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString()
  }
];

export const notificationService = {
  // Listen to notifications in real-time, isolated by hospital tenant
  listenNotifications(hospitalId, callback) {
    const q = query(
      collection(db, COLLECTION),
      where("hospitalId", "==", hospitalId || "WHC-2026-1001")
    );

    return onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (list.length === 0) {
        list = DEFAULT_NOTIFICATIONS;
      }
      // Sort chronologically descending client-side
      list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      callback(list);
    }, (error) => {
      console.error("Error listening to notifications:", error);
      callback(DEFAULT_NOTIFICATIONS);
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

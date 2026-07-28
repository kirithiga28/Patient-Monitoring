import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/config";

const COLLECTION = "notifications";

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
      const hId = hospitalId || "WHC-2026-1001";
      const docRef = await addDoc(collection(db, COLLECTION), {
        type,
        message,
        hospitalId: hId,
        timestamp: new Date().toISOString()
      });

      // Post activity log "Notification Created"
      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
        if (token) {
          await fetch("http://localhost:5000/api/activities", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              patientId: "N/A",
              patientName: "System",
              activityType: "Notification Created",
              description: `Notification created: ${message}`,
              hospitalId: hId
            })
          });
        }
      } catch (e) {
        console.warn("Failed to log notification creation activity:", e);
      }

      return { id: docRef.id };
    } catch (err) {
      console.error("Error adding notification:", err);
      throw err;
    }
  }
};

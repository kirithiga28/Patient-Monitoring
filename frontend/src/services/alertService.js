import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase/config";
import { notificationService } from "./notificationService";

const COLLECTION = "alerts";

export const alertService = {
  // Listen to alerts in real-time, filtered by hospital tenant
  listenAlerts(userRole, hospitalId, callback) {
    let q = collection(db, COLLECTION);
    
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort chronologically desc on client side
      alerts.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      callback(alerts);
    }, (error) => {
      console.error("Error listening to alerts:", error);
      callback([]);
    });
  },

  // Listen to alerts for a specific patient
  listenAlertsForPatient(patientId, callback) {
    if (!patientId) return () => {};
    let q = query(
      collection(db, COLLECTION),
      where("patientId", "==", patientId)
    );

    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort chronologically desc on client side
      alerts.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      callback(alerts);
    }, (error) => {
      console.error("Error listening to patient alerts:", error);
      callback([]);
    });
  },

  // Create an alert (used by UI or AI microservice)
  async createAlert(alertData) {
    const hId = alertData.hospitalId || "WHC-2026-1001";
    const newAlert = {
      patientId: alertData.patientId || "",
      patientName: alertData.patientName || "Unknown",
      room: alertData.room || alertData.roomNumber || "Unknown",
      alertType: alertData.alertType || "Emergency Alert",
      severity: alertData.severity || "High",
      status: alertData.status || "Open",
      timestamp: alertData.timestamp || alertData.alertTime || new Date().toISOString(),
      hospitalId: hId,
      createdBy: alertData.createdBy || "System",
      resolvedBy: ""
    };
    const docRef = await addDoc(collection(db, COLLECTION), newAlert);
    
    // Add Emergency Alert Created notification
    await notificationService.addNotification(
      "Emergency Alert Created",
      `Emergency Alert (${newAlert.alertType}) raised for patient ${newAlert.patientName}.`,
      hId
    );

    return { id: docRef.id, ...newAlert };
  },

  // Acknowledge an alert
  async acknowledgeAlert(alertId, userId) {
    const docRef = doc(db, COLLECTION, alertId);
    await updateDoc(docRef, {
      status: "Acknowledged",
      resolvedBy: userId
    });
  },

  // Resolve an alert
  async resolveAlert(alertId, userId, notes = "") {
    const docRef = doc(db, COLLECTION, alertId);
    await updateDoc(docRef, {
      status: "Resolved",
      resolvedBy: userId,
      notes: notes
    });
  }
};

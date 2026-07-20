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

const DEFAULT_ALERTS = [
  {
    id: "alt_101",
    patientId: "pat_101",
    patientName: "John Doe",
    room: "101",
    alertType: "Cardiac Distress Alarm",
    severity: "Critical",
    status: "Open",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    hospitalId: "WHC-2026-1001",
    createdBy: "AI Telemetry Guard"
  },
  {
    id: "alt_110",
    patientId: "pat_110",
    patientName: "Robert Chen",
    room: "110",
    alertType: "Low Oxygen Saturation (88%)",
    severity: "Critical",
    status: "Open",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    hospitalId: "WHC-2026-1001",
    createdBy: "Vitals Monitor"
  },
  {
    id: "alt_105",
    patientId: "pat_105",
    patientName: "Jane Smith",
    room: "105",
    alertType: "Bedside Emergency Call",
    severity: "High",
    status: "Acknowledged",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    hospitalId: "WHC-2026-1001",
    createdBy: "Nurse Station"
  }
];

export const alertService = {
  // Listen to alerts in real-time, filtered by hospital tenant
  listenAlerts(userRole, hospitalId, callback) {
    let q = collection(db, COLLECTION);
    
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      let alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (alerts.length === 0) {
        alerts = DEFAULT_ALERTS;
      }
      // Sort chronologically desc on client side
      alerts.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      callback(alerts);
    }, (error) => {
      console.error("Error listening to alerts:", error);
      callback(DEFAULT_ALERTS);
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
      let alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (alerts.length === 0) {
        alerts = DEFAULT_ALERTS.filter(a => a.patientId === patientId);
      }
      // Sort chronologically desc on client side
      alerts.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      callback(alerts);
    }, (error) => {
      console.error("Error listening to patient alerts:", error);
      callback(DEFAULT_ALERTS.filter(a => a.patientId === patientId));
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

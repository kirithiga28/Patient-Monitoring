import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "activities";

const DEFAULT_ACTIVITIES = [
  {
    id: "act_1",
    patientName: "John Doe",
    patientId: "pat_101",
    activity: "Sudden Heart Rate Spike (110 BPM)",
    confidence: "96%",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    hospitalId: "WHC-2026-1001"
  },
  {
    id: "act_2",
    patientName: "Jane Smith",
    patientId: "pat_105",
    activity: "Oxygen Saturation Normal (96%)",
    confidence: "98%",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    hospitalId: "WHC-2026-1001"
  },
  {
    id: "act_3",
    patientName: "Robert Chen",
    patientId: "pat_110",
    activity: "Fever Alarm (101.4 °F)",
    confidence: "94%",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    hospitalId: "WHC-2026-1001"
  },
  {
    id: "act_4",
    patientName: "Emily Davis",
    patientId: "pat_201",
    activity: "Patient Bed Motion Detected",
    confidence: "91%",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    hospitalId: "WHC-2026-1001"
  }
];

export const activityService = {
  listenActivities(userRole, hospitalId, callback, limitCount = 50) {
    let q = collection(db, COLLECTION);
    
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      let activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (activities.length === 0) {
        activities = DEFAULT_ACTIVITIES;
      }
      // Sort client-side
      activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      // Limit client-side
      if (activities.length > limitCount) {
        activities = activities.slice(0, limitCount);
      }
      callback(activities);
    }, (error) => {
      console.error("Error listening to activities:", error);
      callback(DEFAULT_ACTIVITIES);
    });
  },

  listenActivitiesForPatient(patientId, callback, limitCount = 50) {
    if (!patientId) return () => {};
    let q = query(
      collection(db, COLLECTION),
      where("patientId", "==", patientId)
    );

    return onSnapshot(q, (snapshot) => {
      let activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (activities.length === 0) {
        activities = DEFAULT_ACTIVITIES.filter(a => a.patientId === patientId);
      }
      // Sort client-side
      activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      // Limit client-side
      if (activities.length > limitCount) {
        activities = activities.slice(0, limitCount);
      }
      callback(activities);
    }, (error) => {
      console.error("Error listening to patient activities:", error);
      callback(DEFAULT_ACTIVITIES.filter(a => a.patientId === patientId));
    });
  }
};

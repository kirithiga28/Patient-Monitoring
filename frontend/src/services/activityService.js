import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "activities";

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
      // Sort client-side
      activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      // Limit client-side
      if (activities.length > limitCount) {
        activities = activities.slice(0, limitCount);
      }
      callback(activities);
    }, (error) => {
      console.error("Error listening to activities:", error);
      callback([]);
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
      // Sort client-side
      activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      // Limit client-side
      if (activities.length > limitCount) {
        activities = activities.slice(0, limitCount);
      }
      callback(activities);
    }, (error) => {
      console.error("Error listening to patient activities:", error);
      callback([]);
    });
  }
};

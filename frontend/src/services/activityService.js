import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "activities";

export const activityService = {
  listenActivities(userRole, hospitalId, callback, limitCount = 50) {
    let q = collection(db, COLLECTION);
    
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }
    
    q = query(q, orderBy("timestamp", "desc"), limit(limitCount));

    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(activities);
    }, (error) => {
      console.error("Error listening to activities:", error);
    });
  },

  listenActivitiesForPatient(patientId, callback, limitCount = 50) {
    if (!patientId) return () => {};
    let q = query(
      collection(db, COLLECTION),
      where("patientId", "==", patientId),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(activities);
    }, (error) => {
      console.error("Error listening to patient activities:", error);
    });
  }
};

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../firebase/config";

const HISTORY_COLLECTION = "vitals_history";

export const vitalsService = {
  // Fetch vitals history for graphs
  async getVitalsHistory(patientId, maxCount = 20) {
    const q = query(
      collection(db, HISTORY_COLLECTION),
      where("patientId", "==", patientId),
      orderBy("timestamp", "desc"),
      limit(maxCount)
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Return in chronological order
    return history.reverse();
  },

  // Record vitals and update the current vitals in patient record
  async recordVitals(patientId, vitals, hospitalId) {
    const timestamp = new Date().toISOString();
    const vitalsRecord = {
      patientId,
      hospitalId: hospitalId || "hosp_default",
      timestamp,
      heartRate: Number(vitals.heartRate),
      temperature: Number(vitals.temperature),
      bloodPressure: vitals.bloodPressure,
      oxygenSaturation: Number(vitals.oxygenSaturation),
      respiratoryRate: Number(vitals.respiratoryRate)
    };

    // Add to history log
    await addDoc(collection(db, HISTORY_COLLECTION), vitalsRecord);

    // Update current vitals in patient profile
    const patientDocRef = doc(db, "patients", patientId);
    await updateDoc(patientDocRef, {
      vitals: {
        heartRate: vitalsRecord.heartRate,
        temperature: vitalsRecord.temperature,
        bloodPressure: vitalsRecord.bloodPressure,
        oxygenSaturation: vitalsRecord.oxygenSaturation,
        respiratoryRate: vitalsRecord.respiratoryRate
      }
    });

    return vitalsRecord;
  }
};

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION = "cameras";

export const cameraService = {
  // Listen to camera devices
  listenCameras(userRole, hospitalId, callback) {
    let q = collection(db, COLLECTION);
    
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      const cameras = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(cameras);
    }, (error) => {
      console.error("Error listening to cameras:", error);
    });
  },

  // Add a camera mapping
  async addCamera(cameraData) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      name: cameraData.name || "New Camera",
      room: cameraData.room || "",
      streamUrl: cameraData.streamUrl || "webcam",
      type: cameraData.type || "Webcam",
      status: cameraData.status || "Active",
      patientId: cameraData.patientId || "",
      hospitalId: cameraData.hospitalId || "hosp_default",
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...cameraData };
  },

  // Update a camera setting/status
  async updateCamera(cameraId, cameraData) {
    const docRef = doc(db, COLLECTION, cameraId);
    await updateDoc(docRef, cameraData);
  },

  // Delete camera device
  async deleteCamera(cameraId) {
    const docRef = doc(db, COLLECTION, cameraId);
    await deleteDoc(docRef);
  }
};

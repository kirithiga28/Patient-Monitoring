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

const DEFAULT_CAMERAS = [
  {
    id: "cam_101",
    name: "ICU Isolation Feed - Cam 1",
    room: "101",
    streamUrl: "webcam",
    type: "Webcam",
    status: "Active",
    patientId: "pat_101",
    hospitalId: "WHC-2026-1001"
  },
  {
    id: "cam_105",
    name: "Ward Room 105 - Cam 2",
    room: "105",
    streamUrl: "webcam",
    type: "Webcam",
    status: "Active",
    patientId: "pat_105",
    hospitalId: "WHC-2026-1001"
  },
  {
    id: "cam_110",
    name: "ICU Ward Room 110 - Cam 3",
    room: "110",
    streamUrl: "webcam",
    type: "Webcam",
    status: "Active",
    patientId: "pat_110",
    hospitalId: "WHC-2026-1001"
  }
];

export const cameraService = {
  // Listen to camera devices
  listenCameras(userRole, hospitalId, callback) {
    let q = collection(db, COLLECTION);
    
    if (userRole !== "super_admin" && hospitalId) {
      q = query(q, where("hospitalId", "==", hospitalId));
    }

    return onSnapshot(q, (snapshot) => {
      let cameras = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (cameras.length === 0) {
        cameras = DEFAULT_CAMERAS;
      }
      callback(cameras);
    }, (error) => {
      console.error("Error listening to cameras:", error);
      callback(DEFAULT_CAMERAS);
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

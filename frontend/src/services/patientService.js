import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { notificationService } from "./notificationService";

const COLLECTION = "patients";
const BACKEND_URL = "http://localhost:5000";

export const patientService = {
  // Fetch single patient by ID
  async getPatient(id) {
    // 1. Try Backend REST API
    try {
      const res = await fetch(`${BACKEND_URL}/api/patients/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) return data;
      }
    } catch (e) {
      console.warn("Backend patient fetch warning:", e.message);
    }

    // 2. Try Firestore
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.warn("Firestore patient doc fetch warning:", e.message);
    }
    return null;
  },

  // Listen to patients real-time with STRICT DOCTOR OWNERSHIP ISOLATION
  listenPatients(userRole, hospitalId, currentDoctor, assignedRooms, callback) {
    const doctorId = currentDoctor?.uid || currentDoctor?.id || currentDoctor?.doctorId;
    const doctorEmail = currentDoctor?.email;
    const doctorName = currentDoctor?.name;

    let lastError = null;

    const fetchBackendPatients = async () => {
      try {
        let url = `${BACKEND_URL}/api/patients`;
        const params = new URLSearchParams();
        if (doctorId) params.append("doctorId", doctorId);
        if (doctorEmail) params.append("doctorEmail", doctorEmail);
        if (doctorName) params.append("doctor", doctorName);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            return list;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.message || `Server responded with status ${res.status}`;
        }
      } catch (e) {
        lastError = "Unable to connect to server: " + e.message;
        console.warn("Backend patient listener warning:", e.message);
      }
      return null;
    };

    // Firestore listener
    let q = collection(db, COLLECTION);
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let patientList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // Merge backend REST API patients if available
      const backendList = await fetchBackendPatients();
      if (backendList) {
        const map = new Map();
        [...patientList, ...backendList].forEach(p => {
          map.set(p.id || p.patientId, p);
        });
        patientList = Array.from(map.values());
      }

      // STRICT DOCTOR OWNERSHIP FILTERING
      if (currentDoctor) {
        patientList = patientList.filter(p => {
          const isDocId = doctorId && (p.doctorId === doctorId || p.createdBy === doctorId || p.doctor === doctorId);
          const isDocEmail = doctorEmail && (p.doctorEmail === doctorEmail || p.doctor === doctorEmail);
          const isDocName = doctorName && (p.doctor === doctorName || p.doctorName === doctorName);
          return isDocId || isDocEmail || isDocName;
        });
      } else {
        patientList = [];
      }

      callback(patientList, lastError);
    }, async (error) => {
      console.warn("Firestore patient listener warning:", error.message);
      lastError = error.message || "Firestore permission error";
      const backendList = await fetchBackendPatients();
      if (backendList) {
        let patientList = backendList;
        if (currentDoctor) {
          patientList = patientList.filter(p => {
            const isDocId = doctorId && (p.doctorId === doctorId || p.createdBy === doctorId || p.doctor === doctorId);
            const isDocEmail = doctorEmail && (p.doctorEmail === doctorEmail || p.doctor === doctorEmail);
            const isDocName = doctorName && (p.doctor === doctorName || p.doctorName === doctorName);
            return isDocId || isDocEmail || isDocName;
          });
        } else {
          patientList = [];
        }
        callback(patientList, lastError);
      } else {
        callback([], lastError);
      }
    });

    return unsubscribe;
  },

  // Listen to critical patients real-time with STRICT DOCTOR ISOLATION
  listenCriticalPatients(hospitalId, currentDoctor, callback) {
    // If callback passed as second argument
    if (typeof currentDoctor === "function") {
      callback = currentDoctor;
      currentDoctor = null;
    }

    const doctorId = currentDoctor?.uid || currentDoctor?.id || currentDoctor?.doctorId;
    const doctorEmail = currentDoctor?.email;
    const doctorName = currentDoctor?.name;

    const fetchBackendCritical = async () => {
      try {
        let url = `${BACKEND_URL}/api/patients`;
        const params = new URLSearchParams();
        if (doctorId) params.append("doctorId", doctorId);
        if (doctorEmail) params.append("doctorEmail", doctorEmail);
        if (doctorName) params.append("doctor", doctorName);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            return list.filter(p => p.status === "Critical");
          }
        }
      } catch (e) {
        console.warn("Backend critical patients fetch warning:", e.message);
      }
      return null;
    };

    const q = query(
      collection(db, "critical_patients"),
      where("hospitalId", "==", hospitalId || "WHC-2026-1001")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      const backendList = await fetchBackendCritical();
      if (backendList && backendList.length > 0) {
        const map = new Map();
        [...list, ...backendList].forEach(p => map.set(p.id || p.patientId, p));
        list = Array.from(map.values());
      }

      // STRICT DOCTOR FILTERING FOR CRITICAL PATIENTS
      if (currentDoctor) {
        list = list.filter(p => {
          const isDocId = doctorId && (p.doctorId === doctorId || p.createdBy === doctorId || p.doctor === doctorId);
          const isDocEmail = doctorEmail && (p.doctorEmail === doctorEmail || p.doctor === doctorEmail);
          const isDocName = doctorName && (p.doctor === doctorName || p.doctorName === doctorName);
          return isDocId || isDocEmail || isDocName;
        });
      } else {
        list = [];
      }

      list.sort((a, b) => new Date(b.criticalSince || b.createdAt || 0) - new Date(a.criticalSince || a.createdAt || 0));
      callback(list);
    }, async (error) => {
      console.warn("Firestore critical patients listener warning:", error.message);
      const backendList = await fetchBackendCritical();
      if (backendList) {
        callback(backendList);
      } else {
        callback([]);
      }
    });

    return unsubscribe;
  },

  // Create a patient record and store in backend database + Firestore
  async addPatient(patientData, hospitalId, currentDoctor) {
    const hId = hospitalId || patientData.hospitalId || "WHC-2026-1001";
    const docName = currentDoctor?.name || patientData.doctor || "Dr. WellCare";
    const docId = currentDoctor?.uid || currentDoctor?.id || currentDoctor?.doctorId || patientData.doctorId || "DOC-1001";
    const docEmail = currentDoctor?.email || patientData.doctorEmail || "doctor@wellcare.com";

    const patId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanData = {
      id: patId,
      patientId: patId,
      name: patientData.name || "Unknown Patient",
      patientName: patientData.name || "Unknown Patient",
      age: Number(patientData.age) || 0,
      gender: patientData.gender || "Male",
      bloodGroup: patientData.bloodGroup || "O+",
      doctor: docName,
      doctorName: docName,
      doctorId: docId,
      doctorEmail: docEmail,
      createdBy: docId,
      room: patientData.room || "Room 101",
      roomNumber: patientData.room || "Room 101",
      contact: patientData.contact || patientData.phone || "N/A",
      phone: patientData.phone || patientData.contact || "N/A",
      address: patientData.address || "N/A",
      diagnosis: patientData.diagnosis || "General Observation",
      history: patientData.history || "No medical history recorded",
      medicalHistory: patientData.history || "No medical history recorded",
      allergies: patientData.allergies || "None",
      currentMedication: patientData.currentMedication || patientData.medication || "None prescribed",
      admissionDate: patientData.admissionDate || new Date().toISOString().split("T")[0],
      emergencyContact: patientData.emergencyContact || "N/A",
      status: patientData.status || "Stable",
      riskScore: Number(patientData.riskScore) || 10,
      hospitalId: hId,
      createdAt: new Date().toISOString(),
      vitals: patientData.vitals || {
        heartRate: 75,
        temperature: 98.6,
        bloodPressure: "120/80",
        oxygenSaturation: 98,
        respiratoryRate: 16
      }
    };

    // 1. Save to Backend REST API
    let token = null;
    try {
      // Retrieve auth token if available
    } catch (_) {}

    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}/api/patients`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(cleanData)
    });

    if (!res.ok) {
      let errMsg = "Failed to save patient record to backend database.";
      try {
        const errData = await res.json();
        errMsg = errData.message || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }

    // 2. Save to Firestore (Frontend Client SDK Backup Write)
    try {
      const docRef = doc(db, COLLECTION, patId);
      await setDoc(docRef, cleanData);
    } catch (fsErr) {
      console.warn("Firestore patient client write warning:", fsErr.message);
    }

    // Notification trigger
    try {
      await notificationService.addNotification(
        "Patient Registered",
        `Patient ${cleanData.name} (ID: ${cleanData.patientId}) has been registered under ${docName}.`,
        hId
      );
    } catch (e) {
      console.warn("Notification trigger warning:", e);
    }

    return cleanData;
  },

  // Update patient record
  async updatePatient(id, patientData) {
    const cleanUpdates = {
      ...patientData,
      updatedAt: new Date().toISOString()
    };

    if (cleanUpdates.name) cleanUpdates.patientName = cleanUpdates.name;
    if (cleanUpdates.patientName) cleanUpdates.name = cleanUpdates.patientName;
    if (cleanUpdates.room) cleanUpdates.roomNumber = cleanUpdates.room;
    if (cleanUpdates.roomNumber) cleanUpdates.room = cleanUpdates.roomNumber;
    if (cleanUpdates.history) cleanUpdates.medicalHistory = cleanUpdates.history;
    if (cleanUpdates.medicalHistory) cleanUpdates.history = cleanUpdates.medicalHistory;
    if (cleanUpdates.phone) cleanUpdates.contact = cleanUpdates.phone;
    if (cleanUpdates.contact) cleanUpdates.phone = cleanUpdates.contact;

    const res = await fetch(`${BACKEND_URL}/api/patients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanUpdates)
    });

    if (!res.ok) {
      let errMsg = "Failed to update patient record on backend.";
      try {
        const errData = await res.json();
        errMsg = errData.message || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }

    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, cleanUpdates);
    } catch (e) {
      console.warn("Firestore patient update warning:", e.message);
    }

    return cleanUpdates;
  },

  // Delete patient record
  async deletePatient(id) {
    const res = await fetch(`${BACKEND_URL}/api/patients/${id}`, { method: "DELETE" });
    if (!res.ok) {
      let errMsg = "Failed to delete patient record on backend.";
      try {
        const errData = await res.json();
        errMsg = errData.message || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }

    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore patient delete warning:", e.message);
    }
  }
};

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

  // Listen to patients real-time with DOCTOR OWNERSHIP FILTERING
  listenPatients(userRole, hospitalId, currentDoctor, assignedRooms, callback) {
    const doctorId = currentDoctor?.uid || currentDoctor?.id;
    const doctorEmail = currentDoctor?.email;
    const doctorName = currentDoctor?.name;

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
        }
      } catch (e) {
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
      if (backendList && backendList.length > 0) {
        const map = new Map();
        [...patientList, ...backendList].forEach(p => {
          map.set(p.id || p.patientId, p);
        });
        patientList = Array.from(map.values());
      }

      // DOCTOR OWNERSHIP ISOLATION
      if (currentDoctor && (doctorName || doctorId || doctorEmail)) {
        patientList = patientList.filter(p => {
          const isDocId = doctorId && (p.doctorId === doctorId || p.doctor === doctorId);
          const isDocEmail = doctorEmail && (p.doctorEmail === doctorEmail || p.doctor === doctorEmail);
          const isDocName = doctorName && (p.doctor === doctorName || p.doctorName === doctorName);
          return isDocId || isDocEmail || isDocName;
        });
      }

      callback(patientList);
    }, async (error) => {
      console.warn("Firestore patient listener warning:", error.message);
      const backendList = await fetchBackendPatients();
      if (backendList) {
        callback(backendList);
      } else {
        callback([]);
      }
    });

    return unsubscribe;
  },

  // Listen to critical patients real-time
  listenCriticalPatients(hospitalId, callback) {
    const fetchBackendCritical = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/patients`);
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

      if (list.length === 0) {
        const backendList = await fetchBackendCritical();
        if (backendList && backendList.length > 0) {
          list = backendList;
        }
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
    const docId = currentDoctor?.uid || currentDoctor?.id || patientData.doctorId || "DOC-1001";
    const docEmail = currentDoctor?.email || patientData.doctorEmail || "doctor@wellcare.com";

    const patId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanData = {
      id: patId,
      patientId: patId,
      name: patientData.name || "Unknown Patient",
      age: Number(patientData.age) || 0,
      gender: patientData.gender || "Male",
      bloodGroup: patientData.bloodGroup || "O+",
      doctor: docName,
      doctorId: docId,
      doctorEmail: docEmail,
      room: patientData.room || "Room 101",
      contact: patientData.contact || patientData.phone || "N/A",
      phone: patientData.phone || patientData.contact || "N/A",
      address: patientData.address || "N/A",
      diagnosis: patientData.diagnosis || "General Observation",
      history: patientData.history || "No medical history recorded",
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
    let backendSaved = false;
    try {
      const res = await fetch(`${BACKEND_URL}/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData)
      });
      if (res.ok) {
        backendSaved = true;
      }
    } catch (backendErr) {
      console.warn("Backend patient create REST API warning:", backendErr.message);
    }

    // 2. Save to Firestore
    try {
      const docRef = doc(db, COLLECTION, patId);
      await setDoc(docRef, cleanData);
    } catch (fsErr) {
      console.warn("Firestore patient create warning:", fsErr.message);
      if (!backendSaved) {
        const existing = JSON.parse(localStorage.getItem("wellcare_local_patients") || "[]");
        existing.push(cleanData);
        localStorage.setItem("wellcare_local_patients", JSON.stringify(existing));
      }
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

    // 1. Update Backend REST API
    try {
      await fetch(`${BACKEND_URL}/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanUpdates)
      });
    } catch (e) {
      console.warn("Backend patient update REST API warning:", e.message);
    }

    // 2. Update Firestore
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
    // 1. Delete on Backend REST API
    try {
      await fetch(`${BACKEND_URL}/api/patients/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Backend patient delete REST API warning:", e.message);
    }

    // 2. Delete on Firestore
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore patient delete warning:", e.message);
    }
  }
};

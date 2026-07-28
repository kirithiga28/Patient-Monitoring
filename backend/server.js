const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let db = null;
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, "firebase-credentials.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firebase Admin initialized successfully in Backend using credentials file");
  } else {
    admin.initializeApp({
      projectId: "well-care-hospital"
    });
    db = admin.firestore();
    console.log("Firebase Admin initialized in Backend using default/project configuration");
  }
} catch (error) {
  console.error("Warning: Firebase Admin could not be initialized in Backend:", error.message);
}

// Persistent File Database Setup
const DB_DIR = path.join(__dirname, "db");
const DB_FILE = path.join(DB_DIR, "database.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial Database Schema
const initialDb = {
  doctors: [
    {
      id: "DOC-1001",
      uid: "DOC-1001",
      name: "Dr. Rajesh Mehta",
      email: "rajesh.mehta@gmail.com",
      mobile: "9876543210",
      phone: "9876543210",
      department: "Cardiology",
      specialization: "Cardiology",
      qualification: "MBBS, MD (Cardiology)",
      hospitalName: "Well Care Hospital",
      hospitalCode: "WHC-2026-1001",
      hospitalId: "WHC-2026-1001",
      profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
      createdAt: "2026-07-01T00:00:00.000Z",
      role: "doctor"
    }
  ],
  patients: [
    {
      id: "PAT-1001",
      patientId: "PAT-1001",
      name: "Aarav Sharma",
      age: 8,
      gender: "Male",
      bloodGroup: "O+",
      room: "101",
      diagnosis: "Epilepsy",
      status: "Stable",
      doctor: "Dr. Rajesh Mehta",
      doctorId: "DOC-1001",
      doctorEmail: "rajesh.mehta@gmail.com",
      createdBy: "DOC-1001",
      contact: "9876543210",
      phone: "9876543210",
      address: "123 Main Street, City",
      history: "Frequent seizure monitoring",
      currentMedication: "Anticonvulsants 50mg",
      admissionDate: "2026-07-01",
      emergencyContact: "Father: 9876543299",
      hospitalId: "WHC-2026-1001",
      createdAt: "2026-07-01T00:00:00.000Z",
      vitals: { heartRate: 75, temperature: 98.6, bloodPressure: "120/80", oxygenSaturation: 98, respiratoryRate: 16 }
    }
  ],
  medical_records: [
    {
      id: "REC-1001",
      patientId: "PAT-1001",
      doctorId: "DOC-1001",
      doctorEmail: "rajesh.mehta@gmail.com",
      type: "EEG Test",
      title: "Electroencephalogram Summary",
      description: "Routine EEG shows mild spike activity during hyperventilation.",
      createdAt: "2026-07-02T10:00:00.000Z"
    }
  ],
  vitals: [],
  reports: [],
  treatments: [],
  activities: [],
  alerts: [],
  notifications: []
};

// Helper functions for DB reading and writing
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file:", err);
    return initialDb;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// Initialize database
readDb();

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (/\s/.test(trimmed)) return false;
  if (/\.\./.test(trimmed)) return false;
  if (trimmed.includes(",")) return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];

  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;
  if (tld.toLowerCase() === "cm") return false;
  if (tld.toLowerCase() === "c") return false;

  const tldRegex = /^[a-zA-Z]{2,6}$/;
  return tldRegex.test(tld);
}

function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.length >= 8;
}

// Helper: Filter patient list by doctor ownership
function filterPatientsByDoctor(patients, { doctorId, doctorEmail, doctor }) {
  if (!doctorId && !doctorEmail && !doctor) return [];

  return patients.filter(p => {
    const matchId = doctorId && (p.doctorId === doctorId || p.createdBy === doctorId || p.doctor === doctorId);
    const matchEmail = doctorEmail && (p.doctorEmail === doctorEmail || p.doctor === doctorEmail);
    const matchName = doctor && (p.doctor === doctor || p.doctorName === doctor);
    return matchId || matchEmail || matchName;
  });
}

async function logActivity(patientId, patientName, doctorId, doctorName, activityType, description, hospitalId = "WHC-2026-1001") {
  try {
    const actId = `ACT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newActivity = {
      id: actId,
      activityId: actId,
      patientId: patientId || "N/A",
      patientName: patientName || "N/A",
      doctorId: doctorId || "DOC-1001",
      doctorName: doctorName || "System",
      activity: activityType,
      activityType: activityType,
      type: activityType,
      description: description,
      timestamp: new Date().toISOString(),
      hospitalId: hospitalId
    };

    if (db) {
      await db.collection("activities").doc(actId).set(newActivity);
    }

    const dbData = readDb();
    if (!dbData.activities) dbData.activities = [];
    dbData.activities.push(newActivity);
    writeDb(dbData);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

// Authentication Middleware
async function authenticateDoctor(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      if (admin.apps.length > 0) {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        req.doctor = {
          id: decodedToken.uid,
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split("@")[0]
        };
        return next();
      }
    } catch (err) {
      console.warn("Token verification failed, attempting fallback:", err.message);
    }
  }

  // Fallback for tests/CLI
  const doctorId = req.query.doctorId || (req.body && req.body.doctorId) || req.headers["x-doctor-id"];
  const doctorEmail = req.query.doctorEmail || (req.body && req.body.doctorEmail) || req.headers["x-doctor-email"];
  const doctorName = req.query.doctor || (req.body && req.body.doctor) || req.headers["x-doctor-name"];

  if (doctorId || doctorEmail) {
    req.doctor = {
      id: doctorId || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      uid: doctorId,
      email: doctorEmail || "doctor@wellcare.com",
      name: doctorName || "Dr. WellCare"
    };
    return next();
  }

  return res.status(401).json({ success: false, message: "Authentication required. Please provide a valid doctor context or token." });
}

// ==========================================
// DOCTOR AUTHENTICATION & PROFILE ENDPOINTS
// ==========================================

// Register Doctor
app.post("/api/doctors/register", async (req, res) => {
  try {
    const { email, password, fullName, name, mobile, phone, medRegNo, hospitalCode, department, specialization, qualification } = req.body;
    const doctorName = fullName || name;
    const doctorEmail = (email || "").trim().toLowerCase();

    if (!isValidEmail(doctorEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
    }

    if (!doctorName) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }

    const dbData = readDb();
    const existingDoctor = dbData.doctors.find(d => d.email.toLowerCase() === doctorEmail);

    if (existingDoctor) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    let docId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    let firebaseUid = null;

    if (db) {
      try {
        const usersSnapshot = await db.collection("users")
          .where("role", "==", "doctor")
          .get();

        let isDuplicate = false;
        usersSnapshot.forEach(doc => {
          const u = doc.data();
          if (u.email && u.email.toLowerCase() === doctorEmail) {
            isDuplicate = true;
          }
        });

        if (isDuplicate) {
          return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }

        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
          email: doctorEmail,
          password: password,
          displayName: doctorName
        });
        firebaseUid = userRecord.uid;
        docId = firebaseUid;
      } catch (fbAdminError) {
        console.error("Firebase Admin Auth registration error:", fbAdminError);
        if (fbAdminError.code === "auth/email-already-in-use" || fbAdminError.message.includes("already in use") || fbAdminError.message.includes("already exists")) {
          return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }
        return res.status(400).json({ success: false, message: fbAdminError.message });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newDoctor = {
      id: docId,
      uid: docId,
      doctorId: docId,
      name: doctorName,
      doctorName: doctorName,
      email: doctorEmail,
      password: hashedPassword,
      mobile: mobile || phone || "",
      phone: mobile || phone || "",
      medRegNo: medRegNo || `MED-${Math.floor(10000 + Math.random() * 90000)}`,
      department: department || specialization || "General Medicine",
      specialization: specialization || department || "General Medicine",
      qualification: qualification || "MBBS, MD",
      hospitalName: "Well Care Hospital",
      hospitalCode: hospitalCode || "WHC-2026-1001",
      hospitalId: hospitalCode || "WHC-2026-1001",
      profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
      createdAt: new Date().toISOString(),
      role: "doctor"
    };

    if (db) {
      await db.collection("users").doc(docId).set(newDoctor);
    }

    dbData.doctors.push(newDoctor);
    writeDb(dbData);

    const { password: _, ...doctorInfo } = newDoctor;
    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully",
      doctor: doctorInfo
    });
  } catch (err) {
    console.error("Doctor registration error:", err);
    return res.status(500).json({ success: false, message: "Server error during doctor registration." });
  }
});

// Login Doctor
app.post("/api/doctors/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctorEmail = (email || "").trim().toLowerCase();

    if (!isValidEmail(doctorEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const dbData = readDb();
    const doctor = dbData.doctors.find(d => d.email.toLowerCase() === doctorEmail);

    if (!doctor) {
      return res.status(401).json({ success: false, message: "Incorrect email or password." });
    }

    if (doctor.password && !bcrypt.compareSync(password, doctor.password)) {
      return res.status(401).json({ success: false, message: "Incorrect email or password." });
    }

    const { password: _, ...doctorInfo } = doctor;

    await logActivity(
      "N/A",
      "System",
      doctorInfo.id,
      doctorInfo.name,
      "Doctor Login",
      `Doctor ${doctorInfo.name} successfully logged in.`,
      doctorInfo.hospitalId
    );

    return res.json({
      success: true,
      message: "Login successful",
      doctor: doctorInfo
    });
  } catch (err) {
    console.error("Doctor login error:", err);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// Get Doctor Profile
app.get("/api/doctors/profile/:id", (req, res) => {
  const dbData = readDb();
  const doctor = dbData.doctors.find(d => d.id === req.params.id || d.uid === req.params.id || d.doctorId === req.params.id || d.email.toLowerCase() === req.params.id.toLowerCase());

  if (!doctor) {
    return res.status(404).json({ success: false, message: "Doctor profile not found." });
  }

  const { password: _, ...doctorInfo } = doctor;
  return res.json({ success: true, doctor: doctorInfo });
});

// Update Doctor Profile
app.put("/api/doctors/profile/:id", (req, res) => {
  const dbData = readDb();
  const index = dbData.doctors.findIndex(d => d.id === req.params.id || d.uid === req.params.id || d.doctorId === req.params.id || d.email.toLowerCase() === req.params.id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Doctor profile not found." });
  }

  const existingDoctor = dbData.doctors[index];
  const { profilePhoto, mobile, phone, department, specialization, qualification, name } = req.body;

  dbData.doctors[index] = {
    ...existingDoctor,
    name: name || existingDoctor.name,
    mobile: mobile || phone || existingDoctor.mobile,
    phone: phone || mobile || existingDoctor.phone,
    department: department || specialization || existingDoctor.department,
    specialization: specialization || department || existingDoctor.specialization,
    qualification: qualification || existingDoctor.qualification,
    profilePhoto: profilePhoto || existingDoctor.profilePhoto,
    email: existingDoctor.email
  };

  writeDb(dbData);
  const { password: _, ...doctorInfo } = dbData.doctors[index];
  return res.json({ success: true, message: "Profile updated successfully", doctor: doctorInfo });
});

// ==========================================
// PATIENT MANAGEMENT ENDPOINTS (DOCTOR ISOLATION)
// ==========================================

// Get Patients (Filtered by Doctor Ownership)
app.get("/api/patients", authenticateDoctor, async (req, res) => {
  try {
    const { doctorId, doctorEmail, doctor } = req.query;
    const filterId = doctorId || req.doctor?.id || req.doctor?.uid;
    const filterEmail = doctorEmail || req.doctor?.email;
    const filterName = doctor || req.doctor?.name;

    let patientsList = [];

    if (db) {
      const snapshot = await db.collection("patients").get();
      snapshot.forEach(doc => {
        patientsList.push({ id: doc.id, ...doc.data() });
      });
    } else {
      const dbData = readDb();
      patientsList = dbData.patients;
    }

    const filtered = filterPatientsByDoctor(patientsList, { 
      doctorId: filterId, 
      doctorEmail: filterEmail, 
      doctor: filterName 
    });
    return res.json(filtered);
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return res.status(500).json({ success: false, message: "Internal server error reading patients." });
  }
});

// Get Single Patient (Validates Doctor Ownership)
app.get("/api/patients/:id", authenticateDoctor, async (req, res) => {
  try {
    const { doctorId, doctorEmail, doctor } = req.query;
    const filterId = doctorId || req.doctor?.id || req.doctor?.uid;
    const filterEmail = doctorEmail || req.doctor?.email;
    const filterName = doctor || req.doctor?.name;

    let patient = null;

    if (db) {
      const docSnap = await db.collection("patients").doc(req.params.id).get();
      if (docSnap.exists) {
        patient = { id: docSnap.id, ...docSnap.data() };
      }
    }

    if (!patient) {
      const dbData = readDb();
      patient = dbData.patients.find(p => p.id === req.params.id || p.patientId === req.params.id);
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    if (filterId || filterEmail || filterName) {
      const isOwner = 
        (filterId && (patient.doctorId === filterId || patient.createdBy === filterId || patient.doctor === filterId)) ||
        (filterEmail && (patient.doctorEmail === filterEmail || patient.doctor === filterEmail)) ||
        (filterName && (patient.doctor === filterName || patient.doctorName === filterName));

      if (!isOwner) {
        return res.status(403).json({ success: false, message: "Access denied. You do not own this patient record." });
      }
    }

    return res.json(patient);
  } catch (error) {
    console.error("GET /api/patients/:id error:", error);
    return res.status(500).json({ success: false, message: "Internal server error fetching patient." });
  }
});

// Create Patient Record (Associates with Logged-in Doctor)
app.post("/api/patients", authenticateDoctor, async (req, res) => {
  try {
    const {
      name, age, gender, bloodGroup, contact, phone, address,
      diagnosis, history, currentMedication, doctor, doctorId, doctorEmail,
      room, admissionDate, emergencyContact, status, riskScore, vitals,
      allergies, medicalHistory, patientName, roomNumber
    } = req.body;

    const patName = name || patientName;
    if (!patName || !patName.trim()) {
      return res.status(400).json({ success: false, message: "Patient name is required." });
    }

    const docId = doctorId || req.doctor?.id || req.doctor?.uid || "DOC-1001";
    const docEmail = doctorEmail || req.doctor?.email || "doctor@wellcare.com";
    const docName = doctor || req.doctor?.name || "Dr. WellCare";

    const patId = req.body.patientId || req.body.id || `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const patPhone = phone || contact || "N/A";
    const patHistory = medicalHistory || history || "No medical history recorded";
    const patRoom = roomNumber || room || "Room 101";
    const patAllergies = allergies || "None";

    const newPatient = {
      patientId: patId,
      id: patId,
      doctorId: docId,
      doctorName: docName,
      doctor: docName,
      doctorEmail: docEmail,
      patientName: patName.trim(),
      name: patName.trim(),
      age: Number(age) || 0,
      gender: gender || "Male",
      bloodGroup: bloodGroup || "O+",
      phone: patPhone,
      contact: patPhone,
      address: address || "N/A",
      diagnosis: diagnosis || "General Observation",
      medicalHistory: patHistory,
      history: patHistory,
      allergies: patAllergies,
      roomNumber: patRoom,
      room: patRoom,
      status: status || "Stable",
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: docId,
      currentMedication: currentMedication || "None prescribed",
      admissionDate: admissionDate || new Date().toISOString().split("T")[0],
      emergencyContact: emergencyContact || "N/A",
      riskScore: Number(riskScore) || 10,
      hospitalId: req.body.hospitalId || "WHC-2026-1001",
      vitals: vitals || {
        heartRate: 75,
        temperature: 98.6,
        bloodPressure: "120/80",
        oxygenSaturation: 98,
        respiratoryRate: 16
      }
    };

    if (db) {
      await db.collection("patients").doc(patId).set(newPatient);

      if (newPatient.status === "Critical") {
        await db.collection("critical_patients").doc(patId).set({
          ...newPatient,
          criticalSince: new Date().toISOString()
        });
      } else {
        await db.collection("critical_patients").doc(patId).delete().catch(() => {});
      }
    }

    const dbData = readDb();
    dbData.patients.push(newPatient);
    writeDb(dbData);

    await logActivity(
      newPatient.patientId,
      newPatient.patientName,
      newPatient.doctorId,
      newPatient.doctorName,
      "Patient Registered",
      `Patient ${newPatient.patientName} was successfully registered by ${newPatient.doctorName}.`,
      newPatient.hospitalId
    );

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      patient: newPatient
    });
  } catch (err) {
    console.error("Create patient error:", err);
    return res.status(500).json({ success: false, message: `Failed to create patient record: ${err.message}` });
  }
});

// Update Patient
app.put("/api/patients/:id", authenticateDoctor, async (req, res) => {
  try {
    const patId = req.params.id;
    let existingPatient = null;

    if (db) {
      const docSnap = await db.collection("patients").doc(patId).get();
      if (docSnap.exists) {
        existingPatient = docSnap.data();
      }
    }

    if (!existingPatient) {
      const dbData = readDb();
      existingPatient = dbData.patients.find(p => p.id === patId || p.patientId === patId);
    }

    if (!existingPatient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    const updates = { ...req.body };
    if (updates.name) updates.patientName = updates.name;
    if (updates.patientName) updates.name = updates.patientName;
    if (updates.room) updates.roomNumber = updates.room;
    if (updates.roomNumber) updates.room = updates.roomNumber;
    if (updates.history) updates.medicalHistory = updates.history;
    if (updates.medicalHistory) updates.history = updates.medicalHistory;
    if (updates.phone) updates.contact = updates.phone;
    if (updates.contact) updates.phone = updates.contact;

    const updatedPatient = {
      ...existingPatient,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (db) {
      await db.collection("patients").doc(patId).set(updatedPatient);

      if (updatedPatient.status === "Critical") {
        await db.collection("critical_patients").doc(patId).set({
          ...updatedPatient,
          criticalSince: updatedPatient.criticalSince || new Date().toISOString()
        });
      } else {
        await db.collection("critical_patients").doc(patId).delete().catch(() => {});
      }
    }

    let actType = "Patient Updated";
    let desc = `Updated profile details for patient ${updatedPatient.patientName}.`;

    if (updates.status && updates.status !== existingPatient.status) {
      actType = "Patient Status Changed";
      desc = `Updated patient ${updatedPatient.patientName} status to ${updates.status}.`;
    }
    if (updates.room && updates.room !== existingPatient.room) {
      if (updates.room === "101" || updates.room === "105" || updates.room === "110") {
        actType = "Patient moved to ICU";
        desc = `Transferred patient ${updatedPatient.patientName} to ICU Room ${updates.room}.`;
      } else {
        actType = "Patient moved to Observation Ward";
        desc = `Transferred patient ${updatedPatient.patientName} to Observation Ward Room ${updates.room}.`;
      }
    }

    const dbData = readDb();
    const index = dbData.patients.findIndex(p => p.id === patId || p.patientId === patId);
    if (index !== -1) {
      dbData.patients[index] = updatedPatient;
      writeDb(dbData);
    }

    await logActivity(
      patId,
      updatedPatient.patientName,
      req.doctor?.id || "DOC-1001",
      req.doctor?.name || "System",
      actType,
      desc,
      updatedPatient.hospitalId
    );

    if (updates.status === "Critical" && updates.status !== existingPatient.status) {
      await logActivity(
        patId,
        updatedPatient.patientName,
        req.doctor?.id || "DOC-1001",
        req.doctor?.name || "System",
        "Patient marked Critical",
        `CRITICAL STATUS ALERT triggered for patient ${updatedPatient.patientName}!`,
        updatedPatient.hospitalId
      );
    }

    return res.json({ success: true, message: "Patient updated successfully", patient: updatedPatient });
  } catch (error) {
    console.error("PUT /api/patients/:id error:", error);
    return res.status(500).json({ success: false, message: `Failed to update patient: ${error.message}` });
  }
});

// Delete Patient
app.delete("/api/patients/:id", authenticateDoctor, async (req, res) => {
  try {
    const patId = req.params.id;

    if (db) {
      await db.collection("patients").doc(patId).delete();
      await db.collection("critical_patients").doc(patId).delete().catch(() => {});
    }

    const dbData = readDb();
    const initialLen = dbData.patients.length;
    const patientObj = dbData.patients.find(p => p.id === patId || p.patientId === patId);
    dbData.patients = dbData.patients.filter(p => p.id !== patId && p.patientId !== patId);

    if (dbData.patients.length === initialLen && !db) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    writeDb(dbData);

    if (patientObj) {
      await logActivity(
        patId,
        patientObj.name || patientObj.patientName,
        req.doctor?.id || "DOC-1001",
        req.doctor?.name || "System",
        "Patient Deleted",
        `Removed patient record for ${patientObj.name || patientObj.patientName} from hospital registry.`,
        patientObj.hospitalId || "WHC-2026-1001"
      );
    }

    return res.json({ success: true, message: "Patient deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/patients/:id error:", error);
    return res.status(500).json({ success: false, message: `Failed to delete patient: ${error.message}` });
  }
});

// ==========================================
// SUB-RECORDS ENDPOINTS (DOCTOR FILTERED)
// ==========================================

// Medical Records for Patient or Doctor
app.get("/api/medical-records", authenticateDoctor, async (req, res) => {
  try {
    const { doctorId, doctorEmail, doctor } = req.query;
    const filterId = doctorId || req.doctor?.id || req.doctor?.uid;
    const filterEmail = doctorEmail || req.doctor?.email;
    const filterName = doctor || req.doctor?.name;

    let records = [];

    if (db) {
      const snapshot = await db.collection("medical_records").get();
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
    } else {
      const dbData = readDb();
      records = dbData.medical_records || [];
    }

    if (filterId || filterEmail || filterName) {
      let patientsList = [];
      if (db) {
        const snapshot = await db.collection("patients").get();
        snapshot.forEach(doc => {
          patientsList.push({ id: doc.id, ...doc.data() });
        });
      } else {
        const dbData = readDb();
        patientsList = dbData.patients || [];
      }

      const docPatients = filterPatientsByDoctor(patientsList, { 
        doctorId: filterId, 
        doctorEmail: filterEmail, 
        doctor: filterName 
      }).map(p => p.id);

      records = records.filter(r => r.doctorId === filterId || r.doctorEmail === filterEmail || docPatients.includes(r.patientId));
    }

    return res.json(records);
  } catch (error) {
    console.error("GET /api/medical-records error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch medical records." });
  }
});

app.get("/api/patients/:id/records", authenticateDoctor, async (req, res) => {
  try {
    const patId = req.params.id;
    let records = [];

    if (db) {
      const snapshot = await db.collection("medical_records").where("patientId", "==", patId).get();
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
    } else {
      const dbData = readDb();
      records = (dbData.medical_records || []).filter(r => r.patientId === patId);
    }

    return res.json(records);
  } catch (error) {
    console.error("GET /api/patients/:id/records error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch patient records." });
  }
});

app.post("/api/patients/:id/records", authenticateDoctor, async (req, res) => {
  try {
    const patId = req.params.id;
    const { title, description, date, type, doctor, doctorId, doctorEmail, hospitalId } = req.body;
    
    const recId = `REC-${Date.now()}`;
    const newRecord = {
      id: recId,
      patientId: patId,
      title: title || "Consultation Record",
      description: description || "Routine observation",
      date: date || new Date().toISOString().split("T")[0],
      type: type || "Diagnosis",
      doctor: doctor || req.doctor?.name || "Dr. WellCare",
      doctorId: doctorId || req.doctor?.id || req.doctor?.uid || "DOC-1001",
      doctorEmail: doctorEmail || req.doctor?.email || "doctor@wellcare.com",
      hospitalId: hospitalId || "WHC-2026-1001",
      createdAt: new Date().toISOString()
    };

    if (db) {
      await db.collection("medical_records").doc(recId).set(newRecord);
    }

    const dbData = readDb();
    if (!dbData.medical_records) dbData.medical_records = [];
    dbData.medical_records.push(newRecord);
    writeDb(dbData);

    let patientName = "Unknown";
    const patientObj = dbData.patients.find(p => p.id === patId || p.patientId === patId);
    if (patientObj) {
      patientName = patientObj.name || patientObj.patientName;
    }
    
    const isPrescription = newRecord.type === "Prescription";
    await logActivity(
      patId,
      patientName,
      newRecord.doctorId,
      newRecord.doctor,
      isPrescription ? "Prescription Added" : "Medical Record Updated",
      isPrescription 
        ? `Added prescription dosage schedule for patient ${patientName}: ${newRecord.title}.` 
        : `Updated clinical findings/medical records for patient ${patientName}: ${newRecord.title}.`,
      newRecord.hospitalId
    );

    return res.status(201).json({ success: true, record: newRecord });
  } catch (error) {
    console.error("POST /api/patients/:id/records error:", error);
    return res.status(500).json({ success: false, message: `Failed to save medical record: ${error.message}` });
  }
});

app.put("/api/medical-records/:id", authenticateDoctor, async (req, res) => {
  try {
    const recId = req.params.id;
    let existingRecord = null;

    if (db) {
      const docSnap = await db.collection("medical_records").doc(recId).get();
      if (docSnap.exists) {
        existingRecord = docSnap.data();
      }
    }

    if (!existingRecord) {
      const dbData = readDb();
      existingRecord = (dbData.medical_records || []).find(r => r.id === recId);
    }

    if (!existingRecord) {
      return res.status(404).json({ success: false, message: "Medical record not found." });
    }

    const updatedRecord = {
      ...existingRecord,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    if (db) {
      await db.collection("medical_records").doc(recId).set(updatedRecord);
    }

    const dbData = readDb();
    const index = dbData.medical_records.findIndex(r => r.id === recId);
    if (index !== -1) {
      dbData.medical_records[index] = updatedRecord;
      writeDb(dbData);
    }

    let patientName = "Unknown";
    const patientObj = dbData.patients.find(p => p.id === updatedRecord.patientId || p.patientId === updatedRecord.patientId);
    if (patientObj) {
      patientName = patientObj.name || patientObj.patientName;
    }
    await logActivity(
      updatedRecord.patientId,
      patientName,
      updatedRecord.doctorId,
      updatedRecord.doctor,
      "Medical Record Updated",
      `Updated clinical record (${updatedRecord.title}) for patient ${patientName}.`,
      updatedRecord.hospitalId
    );

    return res.json({ success: true, record: updatedRecord });
  } catch (error) {
    console.error("PUT /api/medical-records/:id error:", error);
    return res.status(500).json({ success: false, message: `Failed to update medical record: ${error.message}` });
  }
});

app.delete("/api/medical-records/:id", authenticateDoctor, async (req, res) => {
  try {
    const recId = req.params.id;

    if (db) {
      await db.collection("medical_records").doc(recId).delete();
    }

    const dbData = readDb();
    dbData.medical_records = (dbData.medical_records || []).filter(r => r.id !== recId);
    writeDb(dbData);

    return res.json({ success: true, message: "Medical record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/medical-records/:id error:", error);
    return res.status(500).json({ success: false, message: `Failed to delete medical record: ${error.message}` });
  }
});

// Treatments for Doctor
app.get("/api/treatments", authenticateDoctor, async (req, res) => {
  try {
    const { doctorId } = req.query;
    const filterId = doctorId || req.doctor?.id || req.doctor?.uid;

    let list = [];

    if (db) {
      const snapshot = await db.collection("treatments").get();
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
    } else {
      const dbData = readDb();
      list = dbData.treatments || [];
    }

    if (filterId) {
      list = list.filter(t => t.doctorId === filterId);
    }

    return res.json(list);
  } catch (error) {
    console.error("GET /api/treatments error:", error);
    return res.status(500).json({ success: false, message: "Internal server error fetching treatments." });
  }
});

app.post("/api/treatments", authenticateDoctor, async (req, res) => {
  try {
    const { patientName, patientId, treatmentType, diagnosis, date, status, doctorId, doctorEmail, hospitalId } = req.body;
    const dbData = readDb();

    const trtId = `TRT-${Date.now()}`;
    const newTreatment = {
      id: trtId,
      patientId: patientId || "N/A",
      patientName: patientName || "Unknown Patient",
      treatmentType: treatmentType || "General Care",
      diagnosis: diagnosis || "N/A",
      date: date || new Date().toISOString().split("T")[0],
      status: status || "Ongoing",
      doctorId: doctorId || req.doctor?.id || req.doctor?.uid || "DOC-1001",
      doctorEmail: doctorEmail || req.doctor?.email || "doctor@wellcare.com",
      hospitalId: hospitalId || "WHC-2026-1001",
      createdAt: new Date().toISOString()
    };

    if (db) {
      await db.collection("treatments").doc(trtId).set(newTreatment);
    }

    if (!dbData.treatments) dbData.treatments = [];
    dbData.treatments.push(newTreatment);
    writeDb(dbData);

    await logActivity(
      newTreatment.patientId,
      newTreatment.patientName,
      newTreatment.doctorId,
      req.doctor?.name || "System",
      "Treatment Added",
      `Added treatment record for ${newTreatment.patientName}: ${newTreatment.treatmentType}.`,
      newTreatment.hospitalId
    );

    return res.status(201).json({ success: true, treatment: newTreatment });
  } catch (error) {
    console.error("POST /api/treatments error:", error);
    return res.status(500).json({ success: false, message: `Failed to save treatment: ${error.message}` });
  }
});

// Custom activities log route
app.post("/api/activities", authenticateDoctor, async (req, res) => {
  try {
    const { patientId, patientName, activityType, description, hospitalId } = req.body;
    await logActivity(
      patientId || "N/A",
      patientName || "N/A",
      req.doctor?.id || "DOC-1001",
      req.doctor?.name || "System",
      activityType || "System Event",
      description || "No description provided",
      hospitalId || "WHC-2026-1001"
    );
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("POST /api/activities error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

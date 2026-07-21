const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
      department: "Cardiology",
      specialization: "Cardiology",
      qualification: "MBBS, MD (Cardiology)",
      hospitalName: "Well Care Hospital",
      hospitalCode: "WHC-2026-1001",
      hospitalId: "WHC-2026-1001",
      profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
      createdAt: new Date().toISOString(),
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
      contact: "9876543210",
      phone: "9876543210",
      address: "123 Main Street, City",
      history: "Frequent seizure monitoring",
      currentMedication: "Anticonvulsants 50mg",
      admissionDate: "2026-07-01",
      emergencyContact: "Father: 9876543299",
      hospitalId: "WHC-2026-1001",
      createdAt: new Date().toISOString(),
      vitals: { heartRate: 75, temperature: 98.6, bloodPressure: "120/80", oxygenSaturation: 98, respiratoryRate: 16 }
    }
  ],
  medical_records: [],
  vitals: [],
  reports: [],
  treatments: [],
  activities: []
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

// Initialize database if missing
readDb();

// Email validation helper
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Password validation helper: minimum 8 characters (only letters, only numbers, or combination allowed)
function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.length >= 8;
}

// ==========================================
// DOCTOR AUTHENTICATION & PROFILE ENDPOINTS
// ==========================================

// Register Doctor
app.post("/api/doctors/register", (req, res) => {
  try {
    const { email, password, fullName, name, mobile, phone, medRegNo, hospitalCode, department, specialization, qualification } = req.body;
    const doctorName = fullName || name;
    const doctorEmail = (email || "").trim().toLowerCase();

    if (!isValidEmail(doctorEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format. Please enter a valid email address." });
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
      return res.status(409).json({ success: false, message: "A doctor account with this email already exists." });
    }

    const docId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newDoctor = {
      id: docId,
      uid: docId,
      name: doctorName,
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
app.post("/api/doctors/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const doctorEmail = (email || "").trim().toLowerCase();

    if (!isValidEmail(doctorEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    const dbData = readDb();
    const doctor = dbData.doctors.find(d => d.email.toLowerCase() === doctorEmail);

    if (!doctor) {
      return res.status(401).json({ success: false, message: "Doctor not found. Please register an account first." });
    }

    if (doctor.password && !bcrypt.compareSync(password, doctor.password)) {
      return res.status(401).json({ success: false, message: "Invalid password. Please check your credentials." });
    }

    const { password: _, ...doctorInfo } = doctor;
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
  const doctor = dbData.doctors.find(d => d.id === req.params.id || d.uid === req.params.id || d.email.toLowerCase() === req.params.id.toLowerCase());

  if (!doctor) {
    return res.status(404).json({ success: false, message: "Doctor profile not found." });
  }

  const { password: _, ...doctorInfo } = doctor;
  return res.json({ success: true, doctor: doctorInfo });
});

// Update Doctor Profile (Allow editing photo, phone, department, qualification. Email immutable.)
app.put("/api/doctors/profile/:id", (req, res) => {
  const dbData = readDb();
  const index = dbData.doctors.findIndex(d => d.id === req.params.id || d.uid === req.params.id || d.email.toLowerCase() === req.params.id.toLowerCase());

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
    // Email is immutable
    email: existingDoctor.email
  };

  writeDb(dbData);
  const { password: _, ...doctorInfo } = dbData.doctors[index];
  return res.json({ success: true, message: "Profile updated successfully", doctor: doctorInfo });
});

// ==========================================
// PATIENT MANAGEMENT ENDPOINTS
// ==========================================

// Get Patients (Filtered by Doctor Ownership)
app.get("/api/patients", (req, res) => {
  const { doctorId, doctorEmail, doctor } = req.query;
  const dbData = readDb();
  let patientList = dbData.patients;

  if (doctorId || doctorEmail || doctor) {
    patientList = patientList.filter(p => {
      const matchId = doctorId && (p.doctorId === doctorId || p.doctor === doctorId);
      const matchEmail = doctorEmail && (p.doctorEmail === doctorEmail || p.doctor === doctorEmail);
      const matchName = doctor && (p.doctor === doctor || p.doctorName === doctor);
      return matchId || matchEmail || matchName;
    });
  }

  return res.json(patientList);
});

// Get Single Patient
app.get("/api/patients/:id", (req, res) => {
  const dbData = readDb();
  const patient = dbData.patients.find(p => p.id === req.params.id || p.patientId === req.params.id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient record not found." });
  }

  return res.json(patient);
});

// Create Patient Record
app.post("/api/patients", (req, res) => {
  try {
    const {
      name, age, gender, bloodGroup, contact, phone, address,
      diagnosis, history, currentMedication, doctor, doctorId, doctorEmail,
      room, admissionDate, emergencyContact, status, riskScore, vitals
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Patient name is required." });
    }

    const dbData = readDb();
    const patId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient = {
      id: patId,
      patientId: patId,
      name: name.trim(),
      age: Number(age) || 0,
      gender: gender || "Male",
      bloodGroup: bloodGroup || "O+",
      contact: contact || phone || "N/A",
      phone: phone || contact || "N/A",
      address: address || "N/A",
      diagnosis: diagnosis || "General Observation",
      history: history || "No prior history recorded",
      currentMedication: currentMedication || "None prescribed",
      doctor: doctor || "Dr. Unassigned",
      doctorId: doctorId || "DOC-1001",
      doctorEmail: doctorEmail || "doctor@wellcare.com",
      room: room || "Room 101",
      admissionDate: admissionDate || new Date().toISOString().split("T")[0],
      emergencyContact: emergencyContact || "N/A",
      status: status || "Stable",
      riskScore: Number(riskScore) || 10,
      hospitalId: "WHC-2026-1001",
      createdAt: new Date().toISOString(),
      vitals: vitals || {
        heartRate: 75,
        temperature: 98.6,
        bloodPressure: "120/80",
        oxygenSaturation: 98,
        respiratoryRate: 16
      }
    };

    dbData.patients.push(newPatient);
    writeDb(dbData);

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      patient: newPatient
    });
  } catch (err) {
    console.error("Create patient error:", err);
    return res.status(500).json({ success: false, message: "Failed to create patient record." });
  }
});

// Update Patient
app.put("/api/patients/:id", (req, res) => {
  const dbData = readDb();
  const index = dbData.patients.findIndex(p => p.id === req.params.id || p.patientId === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Patient not found." });
  }

  dbData.patients[index] = {
    ...dbData.patients[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  writeDb(dbData);
  return res.json({ success: true, message: "Patient updated successfully", patient: dbData.patients[index] });
});

// Delete Patient
app.delete("/api/patients/:id", (req, res) => {
  const dbData = readDb();
  const initialLen = dbData.patients.length;
  dbData.patients = dbData.patients.filter(p => p.id !== req.params.id && p.patientId !== req.params.id);

  if (dbData.patients.length === initialLen) {
    return res.status(404).json({ success: false, message: "Patient not found." });
  }

  writeDb(dbData);
  return res.json({ success: true, message: "Patient deleted successfully" });
});

// ==========================================
// MEDICAL RECORDS & SUB-RECORDS ENDPOINTS
// ==========================================

// Medical Records for Patient
app.get("/api/patients/:id/records", (req, res) => {
  const dbData = readDb();
  const records = (dbData.medical_records || []).filter(r => r.patientId === req.params.id);
  return res.json(records);
});

app.post("/api/patients/:id/records", (req, res) => {
  const dbData = readDb();
  const newRecord = {
    id: `REC-${Date.now()}`,
    patientId: req.params.id,
    ...req.body,
    createdAt: new Date().toISOString()
  };

  if (!dbData.medical_records) dbData.medical_records = [];
  dbData.medical_records.push(newRecord);
  writeDb(dbData);

  return res.status(201).json({ success: true, record: newRecord });
});

// Vitals for Patient
app.get("/api/patients/:id/vitals", (req, res) => {
  const dbData = readDb();
  const vitals = (dbData.vitals || []).filter(v => v.patientId === req.params.id);
  return res.json(vitals);
});

app.post("/api/patients/:id/vitals", (req, res) => {
  const dbData = readDb();
  const newVital = {
    id: `VIT-${Date.now()}`,
    patientId: req.params.id,
    ...req.body,
    timestamp: new Date().toISOString()
  };

  if (!dbData.vitals) dbData.vitals = [];
  dbData.vitals.push(newVital);
  writeDb(dbData);

  return res.status(201).json({ success: true, vital: newVital });
});

// Reports for Patient
app.get("/api/patients/:id/reports", (req, res) => {
  const dbData = readDb();
  const reports = (dbData.reports || []).filter(r => r.patientId === req.params.id);
  return res.json(reports);
});

app.post("/api/patients/:id/reports", (req, res) => {
  const dbData = readDb();
  const newReport = {
    id: `REP-${Date.now()}`,
    patientId: req.params.id,
    ...req.body,
    createdAt: new Date().toISOString()
  };

  if (!dbData.reports) dbData.reports = [];
  dbData.reports.push(newReport);
  writeDb(dbData);

  return res.status(201).json({ success: true, report: newReport });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

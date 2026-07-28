const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_FILE = path.join(__dirname, "..", "db", "database.json");

// Ensure db directory exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 1. Initialize Firebase Admin
let db = null;
try {
  const serviceAccountPath = path.join(__dirname, "..", "firebase-credentials.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firebase Admin initialized successfully using credentials file.");
  } else {
    console.warn("No credentials file found. Resetting local DB only.");
  }
} catch (error) {
  console.error("Warning: Firebase Admin could not be initialized:", error.message);
}

// Default Password Hash for "Password123"
const DEFAULT_PASSWORD = "Password123";
const DEFAULT_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const initialDb = {
  doctors: [
    {
      id: "DOC-1001",
      uid: "DOC-1001",
      name: "Dr. Rajesh Mehta",
      email: "rajesh.mehta@gmail.com",
      password: DEFAULT_HASH,
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
      createdAt: "2026-07-02T10:00:00.000Z",
      hospitalId: "WHC-2026-1001"
    }
  ],
  vitals: [],
  reports: [],
  treatments: [],
  activities: [],
  alerts: [],
  notifications: []
};

async function deleteCollection(collectionName) {
  if (!db) return;
  const colRef = db.collection(collectionName);
  const snapshot = await colRef.get();
  if (snapshot.empty) return;

  console.log(`Deleting ${snapshot.size} documents from Firestore collection '${collectionName}'...`);
  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

async function reset() {
  console.log("=== Starting Database Reset ===");

  // 1. Write backend local DB
  console.log("Overwriting database.json with default schema...");
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));

  if (!db) {
    console.log("Firestore/Firebase config not available. Completed local reset.");
    process.exit(0);
  }

  try {
    // 2. Clean Firestore collections
    const collectionsToClean = [
      "users",
      "patients",
      "medical_records",
      "treatments",
      "vitals_history",
      "alerts",
      "cameras",
      "notifications",
      "activities"
    ];

    for (const col of collectionsToClean) {
      await deleteCollection(col);
    }

    // 3. Write default data to Firestore
    console.log("Seeding default doctor user to Firestore users collection...");
    await db.collection("users").doc("DOC-1001").set(initialDb.doctors[0]);

    console.log("Seeding default patient to Firestore patients collection...");
    await db.collection("patients").doc("PAT-1001").set(initialDb.patients[0]);

    console.log("Seeding default medical record to Firestore medical_records collection...");
    await db.collection("medical_records").doc("REC-1001").set(initialDb.medical_records[0]);

    // 4. Clean Firebase Auth
    console.log("Listing and cleaning Firebase Auth users...");
    const listUsersResult = await admin.auth().listUsers(1000);
    const usersToDelete = [];
    let hasDefaultDoctorInAuth = false;

    listUsersResult.users.forEach((userRecord) => {
      if (userRecord.email && userRecord.email.toLowerCase() === "rajesh.mehta@gmail.com") {
        hasDefaultDoctorInAuth = true;
      } else {
        usersToDelete.push(userRecord.uid);
      }
    });

    if (usersToDelete.length > 0) {
      console.log(`Deleting ${usersToDelete.length} other users from Firebase Auth...`);
      const deleteUsersResult = await admin.auth().deleteUsers(usersToDelete);
      console.log(`Successfully deleted ${deleteUsersResult.successCount} users.`);
      if (deleteUsersResult.failureCount > 0) {
        console.error(`Failed to delete ${deleteUsersResult.failureCount} users.`);
        deleteUsersResult.errors.forEach(err => console.error(err.error.toJSON()));
      }
    }

    // 5. Ensure Dr. Rajesh Mehta exists in Firebase Auth
    if (!hasDefaultDoctorInAuth) {
      console.log("Creating default doctor 'rajesh.mehta@gmail.com' in Firebase Auth...");
      await admin.auth().createUser({
        uid: "DOC-1001",
        email: "rajesh.mehta@gmail.com",
        password: DEFAULT_PASSWORD,
        displayName: "Dr. Rajesh Mehta"
      });
      console.log("Default doctor created successfully.");
    } else {
      console.log("Default doctor 'rajesh.mehta@gmail.com' already exists in Firebase Auth. Resetting password...");
      await admin.auth().updateUser("DOC-1001", {
        password: DEFAULT_PASSWORD,
        displayName: "Dr. Rajesh Mehta"
      });
      console.log("Default doctor password updated to " + DEFAULT_PASSWORD);
    }

    console.log("=== Database and Firebase Auth Reset Completed Successfully ===");
    process.exit(0);
  } catch (err) {
    console.error("Error resetting database and Firebase Auth:", err);
    process.exit(1);
  }
}

reset();

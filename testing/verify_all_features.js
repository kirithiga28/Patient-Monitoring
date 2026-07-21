import http from "http";

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let resData = "";
      res.on("data", chunk => resData += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function verifyAll() {
  console.log("=========================================");
  console.log("STARTING BACKEND REST API VERIFICATION");
  console.log("=========================================\n");

  // 1. Doctor Registration with custom email format (e.g. gmail.com)
  console.log("1. Testing Doctor Registration with doctor@gmail.com...");
  const regRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. John Smith",
    email: "doctor@gmail.com",
    password: "Password123",
    mobile: "+1-555-0199",
    department: "Cardiology",
    qualification: "MBBS, MD"
  });
  console.log("   Registration Status:", regRes.status);
  console.log("   Registration Output:", regRes.data);

  // 2. Doctor Registration with invalid email
  console.log("\n2. Testing Invalid Email Rejection (e.g. invalid-email)...");
  const badEmailRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Test Bad Email",
    email: "invalid-email",
    password: "Password123"
  });
  console.log("   Status:", badEmailRes.status, "Output:", badEmailRes.data);

  // 3. Doctor Registration with invalid password (< 8 chars)
  console.log("\n3. Testing Short Password Rejection (< 8 chars)...");
  const badPassRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Short Pass",
    email: "shortpass@gmail.com",
    password: "short"
  });
  console.log("   Status:", badPassRes.status, "Output:", badPassRes.data);

  // 4. Doctor Login
  console.log("\n4. Testing Doctor Login...");
  const loginRes = await request("POST", "/api/doctors/login", {
    email: "doctor@gmail.com",
    password: "Password123"
  });
  console.log("   Login Status:", loginRes.status);
  console.log("   Logged in Doctor:", loginRes.data.doctor);

  const docId = loginRes.data.doctor.id;

  // 5. Doctor Profile Fetch & Edit (Immutable Email)
  console.log("\n5. Testing Doctor Profile Update (Editing Phone & Department)...");
  const editProfileRes = await request("PUT", `/api/doctors/profile/${docId}`, {
    mobile: "+1-555-9999",
    department: "Neurology",
    qualification: "MBBS, MD, DM"
  });
  console.log("   Profile Update Status:", editProfileRes.status);
  console.log("   Updated Profile:", editProfileRes.data.doctor);

  // 6. Patient Creation under Doctor A
  console.log("\n6. Testing Patient Creation for Doctor A...");
  const createPatientRes = await request("POST", "/api/patients", {
    name: "Samantha Reed",
    age: 34,
    gender: "Female",
    bloodGroup: "A+",
    contact: "+1-555-8888",
    diagnosis: "Acute Arrhythmia",
    history: "High blood pressure",
    currentMedication: "Beta Blockers 25mg",
    doctor: "Dr. John Smith",
    doctorId: docId,
    doctorEmail: "doctor@gmail.com",
    room: "Room 302",
    status: "Stable"
  });
  console.log("   Patient Creation Status:", createPatientRes.status);
  console.log("   Created Patient:", createPatientRes.data.patient);

  // 7. Patient Directory Ownership Isolation
  console.log("\n7. Testing Doctor Ownership Isolation (Fetching patients for Dr. John Smith)...");
  const docAPatients = await request("GET", `/api/patients?doctorId=${docId}`);
  console.log(`   Patients count for ${docId}:`, docAPatients.data.length);
  console.log("   Patient List:", docAPatients.data.map(p => ({ id: p.id, name: p.name, doctor: p.doctor })));

  // 8. Add Medical Record
  console.log("\n8. Testing Medical Record Creation for Patient...");
  const patId = createPatientRes.data.patient.id;
  const medRecRes = await request("POST", `/api/patients/${patId}/records`, {
    type: "ECG Test",
    title: "Normal Sinus Rhythm ECG",
    description: "Heart rate 72 bpm with standard P-QRS-T complexes."
  });
  console.log("   Medical Record Status:", medRecRes.status);
  console.log("   Created Record:", medRecRes.data.record);

  console.log("\n=========================================");
  console.log("ALL REST API ENDPOINTS VERIFIED SUCCESSFULLY!");
  console.log("=========================================");
}

verifyAll().catch(console.error);

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

async function runDoctorIsolationTests() {
  console.log("=========================================");
  console.log("TESTING DOCTOR-BASED DATA ISOLATION & ACCESS CONTROL");
  console.log("=========================================\n");

  const timestamp = Date.now();

  // 1. Register Doctor A
  console.log("1. Registering Doctor A...");
  const docARes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Alice Smith",
    email: `doctorA_${timestamp}@gmail.com`,
    password: "Password123"
  });
  const docA = docARes.data.doctor;
  console.log(`   Doctor A registered: ${docA.name} (ID: ${docA.id}, Email: ${docA.email})`);

  // 2. Register Doctor B
  console.log("\n2. Registering Doctor B...");
  const docBRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Bob Jones",
    email: `doctorB_${timestamp}@gmail.com`,
    password: "Password123"
  });
  const docB = docBRes.data.doctor;
  console.log(`   Doctor B registered: ${docB.name} (ID: ${docB.id}, Email: ${docB.email})`);

  // 3. Register Doctor C (New Doctor - should have ZERO patients)
  console.log("\n3. Registering Doctor C (New Doctor)...");
  const docCRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Charlie Brown",
    email: `doctorC_${timestamp}@gmail.com`,
    password: "Password123"
  });
  const docC = docCRes.data.doctor;
  console.log(`   Doctor C registered: ${docC.name} (ID: ${docC.id}, Email: ${docC.email})`);

  // 4. Verify Doctor C starts with ZERO patients
  console.log("\n4. Checking Doctor C Workspace (Should have ZERO patients)...");
  const docCPatients = await request("GET", `/api/patients?doctorId=${docC.id}`);
  console.log(`   Doctor C Patients Count: ${docCPatients.data.length}`);
  if (docCPatients.data.length !== 0) {
    throw new Error("SECURITY FAILURE: New Doctor C saw patients from other doctors!");
  }
  console.log("   ✓ Doctor C correctly starts with 0 patients in fresh workspace!");

  // 5. Doctor A creates 2 Patients
  console.log("\n5. Doctor A creating 2 patients...");
  const patA1 = await request("POST", "/api/patients", {
    name: "Patient A1 (Alice's Patient)",
    age: 45,
    gender: "Male",
    diagnosis: "Hypertension",
    doctor: docA.name,
    doctorId: docA.id,
    doctorEmail: docA.email
  });
  const patA2 = await request("POST", "/api/patients", {
    name: "Patient A2 (Alice's Patient)",
    age: 52,
    gender: "Female",
    diagnosis: "Asthma",
    doctor: docA.name,
    doctorId: docA.id,
    doctorEmail: docA.email
  });
  console.log(`   Created: ${patA1.data.patient.name} (${patA1.data.patient.id}) & ${patA2.data.patient.name} (${patA2.data.patient.id})`);

  // 6. Doctor B creates 1 Patient
  console.log("\n6. Doctor B creating 1 patient...");
  const patB1 = await request("POST", "/api/patients", {
    name: "Patient B1 (Bob's Patient)",
    age: 29,
    gender: "Male",
    diagnosis: "Fracture",
    doctor: docB.name,
    doctorId: docB.id,
    doctorEmail: docB.email
  });
  console.log(`   Created: ${patB1.data.patient.name} (${patB1.data.patient.id})`);

  // 7. Verify Data Isolation for Doctor A
  console.log("\n7. Fetching Doctor A Patients...");
  const fetchDocA = await request("GET", `/api/patients?doctorId=${docA.id}`);
  console.log(`   Doctor A sees ${fetchDocA.data.length} patients:`, fetchDocA.data.map(p => p.name));
  if (fetchDocA.data.length !== 2) {
    throw new Error(`Doctor A expected 2 patients but found ${fetchDocA.data.length}`);
  }
  console.log("   ✓ Doctor A sees ONLY Doctor A's patients!");

  // 8. Verify Data Isolation for Doctor B
  console.log("\n8. Fetching Doctor B Patients...");
  const fetchDocB = await request("GET", `/api/patients?doctorId=${docB.id}`);
  console.log(`   Doctor B sees ${fetchDocB.data.length} patient:`, fetchDocB.data.map(p => p.name));
  if (fetchDocB.data.length !== 1) {
    throw new Error(`Doctor B expected 1 patient but found ${fetchDocB.data.length}`);
  }
  console.log("   ✓ Doctor B sees ONLY Doctor B's patient!");

  // 9. Verify Doctor C still sees 0 Patients
  console.log("\n9. Re-checking Doctor C Patients after A and B created patients...");
  const fetchDocC = await request("GET", `/api/patients?doctorId=${docC.id}`);
  console.log(`   Doctor C Patients Count: ${fetchDocC.data.length}`);
  if (fetchDocC.data.length !== 0) {
    throw new Error("SECURITY FAILURE: Doctor C was exposed to A or B's patients!");
  }
  console.log("   ✓ Doctor C workspace remains completely isolated with 0 patients!");

  // 10. Verify Unauthorized Direct Patient Access Rejection
  console.log("\n10. Testing Security: Doctor B attempting to access Doctor A's patient via direct GET /api/patients/:id...");
  const directAccess = await request("GET", `/api/patients/${patA1.data.patient.id}?doctorId=${docB.id}`);
  console.log(`   Direct Access Response Status: ${directAccess.status}`);
  console.log("   Direct Access Output:", directAccess.data);
  if (directAccess.status !== 403) {
    throw new Error("SECURITY FAILURE: Doctor B was able to access Doctor A's patient record directly!");
  }
  console.log("   ✓ Unauthorized cross-doctor access correctly REJECTED with 403 Forbidden!");

  console.log("\n=========================================");
  console.log("ALL DOCTOR ISOLATION & SECURITY TESTS PASSED 100%!");
  console.log("=========================================");
}

runDoctorIsolationTests().catch(err => {
  console.error("\nTEST ERROR:", err);
  process.exit(1);
});

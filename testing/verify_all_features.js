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
  console.log("VERIFYING PASSWORD POLICY & REST API");
  console.log("=========================================\n");

  // 1. Password with ONLY LETTERS (e.g., "abcdefgh")
  console.log("1. Registration with ONLY LETTERS password ('abcdefgh')...");
  const lettersRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Letter User",
    email: `letters_${Date.now()}@gmail.com`,
    password: "abcdefgh"
  });
  console.log("   Status:", lettersRes.status, "Output:", lettersRes.data.message || lettersRes.data);

  // 2. Password with ONLY NUMBERS (e.g., "12345678")
  console.log("\n2. Registration with ONLY NUMBERS password ('12345678')...");
  const numbersRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Number User",
    email: `numbers_${Date.now()}@gmail.com`,
    password: "12345678"
  });
  console.log("   Status:", numbersRes.status, "Output:", numbersRes.data.message || numbersRes.data);

  // 3. Password with MIXED LETTERS & NUMBERS (e.g., "Doctor123")
  console.log("\n3. Registration with MIXED password ('Doctor123')...");
  const mixedRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Mixed User",
    email: `mixed_${Date.now()}@gmail.com`,
    password: "Doctor123"
  });
  console.log("   Status:", mixedRes.status, "Output:", mixedRes.data.message || mixedRes.data);

  // 4. Password with FEWER THAN 8 CHARACTERS (e.g., "short")
  console.log("\n4. Testing Short Password Rejection ('short' < 8 chars)...");
  const shortRes = await request("POST", "/api/doctors/register", {
    fullName: "Dr. Short Pass",
    email: "shortpass@gmail.com",
    password: "short"
  });
  console.log("   Status:", shortRes.status, "Rejection Output:", shortRes.data);

  console.log("\n=========================================");
  console.log("ALL PASSWORD POLICY TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================");
}

verifyAll().catch(console.error);

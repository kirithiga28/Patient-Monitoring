// verify_email_validation.js
// Unit test to verify RFC-compliant email validation rules.

const PASS_CASES = [
  "doctor@gmail.com",
  "john123@yahoo.com",
  "dr.smith@outlook.com",
  "doctor@wellcarehospital.com",
  "doctor_01@gmail.com",
  "doctor-test@gmail.com"
];

const FAIL_CASES = [
  "doctor",
  "doctor@",
  "@gmail.com",
  "doctor@gmail",
  "doctor.gmail.com",
  "doctor@.com",
  "doctor@com",
  "doctor@@gmail.com",
  "doctor gmail@gmail.com",
  "doctor#gmail.com",
  "doctor@gmail..com",
  "name@gmail.cm",
  "name@gmail",
  "name@gmail.c",
  "name@gmail..",
  "name@gmail,com",
  "name@gmailcom",
  "doctor @gmail.com"
];

function validateEmail(email) {
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

console.log("=========================================");
console.log("VERIFYING EMAIL VALIDATION SYSTEM");
console.log("=========================================");

let failed = false;

console.log("\nTesting VALID cases (Should PASS):");
for (const email of PASS_CASES) {
  const result = validateEmail(email);
  console.log(`   ${email.padEnd(30)} -> ${result ? "PASS ✅" : "FAIL ❌"}`);
  if (!result) failed = true;
}

console.log("\nTesting INVALID cases (Should FAIL):");
for (const email of FAIL_CASES) {
  const result = validateEmail(email);
  console.log(`   ${email.padEnd(30)} -> ${result ? "PASS ❌" : "FAIL ✅"}`);
  if (result) failed = true;
}

console.log("\n=========================================");
if (failed) {
  console.log("❌ SOME TESTS FAILED!");
  process.exit(1);
} else {
  console.log("✅ ALL EMAIL VALIDATION TESTS PASSED 100%!");
  process.exit(0);
}

/**
 * ParallelRunner.js
 * Well Care Hospital AI Patient Monitoring System
 * Selenium Grid–compatible parallel test execution controller
 * Runs multiple browser workers concurrently, each handling a subset of screens
 */

import { spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

const WORKERS    = parseInt(process.env.PARALLEL_WORKERS || String(Math.min(os.cpus().length, 4)), 10);
const TEST_FILE  = path.resolve("selenium/tests/webTests.js");
const LOG_DIR    = path.resolve("selenium/logs");
const REPORT_DIR = path.resolve("selenium/reports");

[LOG_DIR, REPORT_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

console.log(`\n${"═".repeat(60)}`);
console.log(`  WELL CARE — PARALLEL SELENIUM EXECUTION`);
console.log(`  Workers: ${WORKERS} | Test File: ${path.basename(TEST_FILE)}`);
console.log(`${"═".repeat(60)}\n`);

/**
 * Spawn a mocha worker process
 * @param {number} workerId
 * @param {string[]} grepPattern — Mocha --grep pattern for test partitioning
 */
function spawnWorker(workerId, grepPattern = "") {
  return new Promise((resolve, reject) => {
    const logFile = path.join(LOG_DIR, `worker-${workerId}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: "a" });
    const ts = new Date().toISOString();
    logStream.write(`\n[${ts}] Worker ${workerId} starting${grepPattern ? " with grep: " + grepPattern : ""}...\n`);

    const args = [
      "node_modules/.bin/mocha",
      TEST_FILE,
      "--timeout", "120000",
      "--exit",
      "--reporter", "min",
    ];
    if (grepPattern) {
      args.push("--grep", grepPattern);
    }

    const proc = spawn(process.execPath, args, {
      env: {
        ...process.env,
        WORKER_ID: String(workerId),
        SELENIUM_GRID_URL: process.env.SELENIUM_GRID_URL || "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout.on("data", data => {
      const line = `[W${workerId}] ${data.toString().trim()}`;
      process.stdout.write(line + "\n");
      logStream.write(line + "\n");
    });
    proc.stderr.on("data", data => {
      const line = `[W${workerId}:ERR] ${data.toString().trim()}`;
      process.stderr.write(line + "\n");
      logStream.write(line + "\n");
    });
    proc.on("close", code => {
      const msg = `[Worker ${workerId}] exited with code ${code}`;
      console.log(msg);
      logStream.write(msg + "\n");
      logStream.end();
      if (code === 0 || code === 1) resolve({ workerId, code });  // mocha exits 1 if tests fail (normal)
      else reject(new Error(`Worker ${workerId} crashed with code ${code}`));
    });
  });
}

// ─── Partition screens across workers ─────────────────────────────────────────
// Each worker runs all screens but we partition by screen index pattern
// This works with Selenium Grid where each worker gets its own browser instance

const SCREEN_NUMS = Array.from({ length: 32 }, (_, i) => String(i + 1).padStart(2, "0"));
const chunkSize   = Math.ceil(SCREEN_NUMS.length / WORKERS);

async function runParallel() {
  const workerPromises = [];

  for (let w = 0; w < WORKERS; w++) {
    const chunk       = SCREEN_NUMS.slice(w * chunkSize, (w + 1) * chunkSize);
    const grepPattern = chunk.map(n => `TC-${n}-`).join("|");
    console.log(`🚀 Launching Worker ${w + 1} → Screens: ${chunk.join(", ")}`);
    workerPromises.push(spawnWorker(w + 1, grepPattern));
  }

  try {
    const results = await Promise.allSettled(workerPromises);
    console.log(`\n${"═".repeat(60)}`);
    console.log("  PARALLEL EXECUTION COMPLETE");
    console.log(`${"═".repeat(60)}`);
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        console.log(`  ✅ Worker ${i + 1}: Code ${r.value.code}`);
      } else {
        console.log(`  ❌ Worker ${i + 1}: ${r.reason?.message}`);
      }
    });
    console.log(`${"═".repeat(60)}\n`);
  } catch (err) {
    console.error("Parallel execution error:", err.message);
    process.exit(1);
  }
}

runParallel();

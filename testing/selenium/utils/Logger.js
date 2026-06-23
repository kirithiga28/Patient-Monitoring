/**
 * Logger.js
 * Well Care Hospital AI Patient Monitoring System
 * Structured test execution logger — timestamp, test ID, name, status, errors
 */

import fs from "fs";
import path from "path";

const LOG_DIR  = path.resolve("selenium/logs");
const LOG_FILE = path.join(LOG_DIR, "selenium-execution.log");

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function write(level, testId = "", testName = "", status = "", message = "") {
  ensureDir();
  const ts   = new Date().toISOString();
  const line = JSON.stringify({ ts, level, testId, testName, status, message }) + "\n";
  fs.appendFileSync(LOG_FILE, line, "utf8");

  // Also print to console with color
  const colours = { INFO: "\x1b[36m", WARN: "\x1b[33m", ERROR: "\x1b[31m", PASS: "\x1b[32m", FAIL: "\x1b[31m" };
  const reset   = "\x1b[0m";
  const colour  = colours[level] || "";
  const tag     = `[${ts}] [${level}]`;
  const parts   = [testId, testName, status, message].filter(Boolean).join(" | ");
  console.log(`${colour}${tag}${reset} ${parts}`);
}

const Logger = {
  info:  (message, testId = "", testName = "", status = "")  => write("INFO",  testId, testName, status, message),
  warn:  (message, testId = "", testName = "", status = "")  => write("WARN",  testId, testName, status, message),
  error: (message, testId = "", testName = "", status = "")  => write("ERROR", testId, testName, status, message),
  pass:  (testId, testName, message = "")                    => write("PASS",  testId, testName, "PASSED", message),
  fail:  (testId, testName, message = "")                    => write("FAIL",  testId, testName, "FAILED", message),

  /**
   * Log a structured test result entry
   * @param {{ testId, testName, status, duration, error }} opts
   */
  testResult({ testId, testName, status, duration = 0, error = "" }) {
    const level = status === "PASSED" ? "PASS" : "FAIL";
    write(level, testId, testName, status, `Duration: ${duration}ms${error ? " | Error: " + error : ""}`);
  },

  /**
   * Log section header for readability
   */
  section(title) {
    ensureDir();
    const bar  = "═".repeat(70);
    const line = `\n${bar}\n  ${title}\n${bar}\n`;
    fs.appendFileSync(LOG_FILE, line, "utf8");
    console.log(`\x1b[35m${bar}\x1b[0m`);
    console.log(`\x1b[35m  ${title}\x1b[0m`);
    console.log(`\x1b[35m${bar}\x1b[0m`);
  },

  getLogPath() { return LOG_FILE; },
};

export default Logger;

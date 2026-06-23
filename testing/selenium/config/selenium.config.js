/**
 * selenium.config.js
 * Well Care Hospital AI Patient Monitoring System
 * Selenium WebDriver Configuration — Grid-Compatible, Auto-Healing, Parallel Execution Support
 */

import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import fs from "fs";
import path from "path";

// ─── Environment ───────────────────────────────────────────────────────────────
export const CONFIG = {
  FRONTEND_URL: "https://patient-monitoring-qxjpim00j-wellcare.vercel.app",
  BACKEND_URL:  "https://wellcare-ai-backend.onrender.com",
  LOCAL_URL:    "http://localhost:5173",
  GRID_URL:     process.env.SELENIUM_GRID_URL || null,   // e.g. "http://localhost:4444"
  IMPLICIT_WAIT: 10000,
  EXPLICIT_WAIT: 20000,
  PAGE_LOAD_TIMEOUT: 60000,
  SCREENSHOT_ON_FAIL: true,
  SCREENSHOT_ON_NAV:  true,

  // Test credentials
  ADMIN_EMAIL:    process.env.TEST_EMAIL    || "test_admin@wellcare.com",
  ADMIN_PASSWORD: process.env.TEST_PASSWORD || "password123",

  // Directories (relative to testing/)
  DIRS: {
    screenshots:  "selenium/screenshots",
    logs:         "selenium/logs",
    reports:      "selenium/reports",
    excelReports: "selenium/excel-reports",
  },

  // Parallel workers
  PARALLEL_WORKERS: parseInt(process.env.PARALLEL_WORKERS || "4", 10),

  // Browser window sizes
  DESKTOP: { width: 1920, height: 1080 },
  TABLET:  { width: 1024, height: 768  },
  MOBILE:  { width: 375,  height: 812  },
};

// ─── Ensure required directories exist ────────────────────────────────────────
export function ensureDirs() {
  Object.values(CONFIG.DIRS).forEach(d => {
    const resolved = path.resolve(d);
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
  });
}

// ─── Chrome Options factory ────────────────────────────────────────────────────
function buildChromeOptions(headless = true) {
  const opts = new chrome.Options();
  if (headless) {
    opts.addArguments("--headless=new");
    opts.addArguments("--disable-gpu");
  }
  opts.addArguments("--no-sandbox");
  opts.addArguments("--disable-dev-shm-usage");
  opts.addArguments("--disable-extensions");
  opts.addArguments("--disable-popup-blocking");
  opts.addArguments(`--window-size=${CONFIG.DESKTOP.width},${CONFIG.DESKTOP.height}`);
  opts.addArguments("--disable-blink-features=AutomationControlled");
  opts.addArguments("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
  return opts;
}

// ─── Driver Factory ────────────────────────────────────────────────────────────
export async function createDriver({ headless = true } = {}) {
  ensureDirs();
  const opts = buildChromeOptions(headless);

  let builder = new Builder().forBrowser("chrome").setChromeOptions(opts);

  if (CONFIG.GRID_URL) {
    builder = builder.usingServer(CONFIG.GRID_URL);
  }

  const driver = await builder.build();
  await driver.manage().setTimeouts({
    implicit: CONFIG.IMPLICIT_WAIT,
    pageLoad: CONFIG.PAGE_LOAD_TIMEOUT,
    script:   30000,
  });

  return driver;
}

// ─── URL Resolution (fallback to local if Vercel protected) ───────────────────
export async function resolveTargetUrl(driver) {
  try {
    await driver.get(CONFIG.FRONTEND_URL);
    await driver.sleep(2000);
    const title = await driver.getTitle();
    if (
      title.toLowerCase().includes("deployment protection") ||
      title.toLowerCase().includes("vercel") ||
      title === ""
    ) {
      return CONFIG.LOCAL_URL;
    }
    return CONFIG.FRONTEND_URL;
  } catch {
    return CONFIG.LOCAL_URL;
  }
}

export default CONFIG;

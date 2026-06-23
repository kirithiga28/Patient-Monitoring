/**
 * ScreenshotUtility.js
 * Well Care Hospital AI Patient Monitoring System
 * Centralized screenshot capture for failures, navigation events, and milestones
 */

import fs from "fs";
import path from "path";
import Logger from "./Logger.js";

export default class ScreenshotUtility {
  static DIR = path.resolve("selenium/screenshots");

  static _ensureDir() {
    if (!fs.existsSync(this.DIR)) {
      fs.mkdirSync(this.DIR, { recursive: true });
    }
  }

  /**
   * Capture a screenshot and save it
   * @param {import('selenium-webdriver').WebDriver} driver
   * @param {string} label — descriptive label for file naming
   * @returns {string} absolute file path of saved screenshot
   */
  static async take(driver, label) {
    this._ensureDir();
    const timestamp  = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName   = label.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const fileName   = `${safeName}_${timestamp}.png`;
    const filePath   = path.join(this.DIR, fileName);

    try {
      const base64 = await driver.takeScreenshot();
      fs.writeFileSync(filePath, base64, "base64");
      Logger.info(`[Screenshot] Captured: ${filePath}`);
      return filePath;
    } catch (err) {
      Logger.warn(`[Screenshot] Failed to capture "${label}": ${err.message}`);
      return "";
    }
  }

  /**
   * Take screenshot on test failure
   */
  static async onFailure(driver, testId, errorMsg = "") {
    const label = `FAIL_${testId}`;
    const p     = await this.take(driver, label);
    if (p) Logger.error(`[Screenshot:FAIL] ${testId} — ${errorMsg} → ${p}`);
    return p;
  }

  /**
   * Take screenshot on successful navigation to a new screen
   */
  static async onNavigation(driver, screenName) {
    return await this.take(driver, `NAV_${screenName}`);
  }

  /**
   * Take screenshot at end of full test suite
   */
  static async onSuiteEnd(driver, suiteName) {
    return await this.take(driver, `SUITE_END_${suiteName}`);
  }

  /**
   * Take screenshot after successful login
   */
  static async onLogin(driver) {
    return await this.take(driver, "LOGIN_SUCCESS");
  }

  /**
   * Take screenshot after dashboard load
   */
  static async onDashboardLoad(driver) {
    return await this.take(driver, "DASHBOARD_LOADED");
  }

  /**
   * List all captured screenshots
   */
  static listAll() {
    this._ensureDir();
    return fs.readdirSync(this.DIR).filter(f => f.endsWith(".png"));
  }

  /**
   * Get relative web path for HTML report linking
   */
  static webPath(filePath) {
    if (!filePath) return "";
    return path.relative(path.resolve("selenium/reports"), filePath).replace(/\\/g, "/");
  }
}

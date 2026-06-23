/**
 * BasePage.js — Page Object Model Base Class
 * Well Care Hospital AI Patient Monitoring System
 * Auto-Healing Selector Engine | Screenshot Capture | Wait Strategies
 */

import { By, until, Key } from "selenium-webdriver";
import Logger from "../utils/Logger.js";
import ScreenshotUtility from "../utils/ScreenshotUtility.js";
import { CONFIG } from "../config/selenium.config.js";

export default class BasePage {
  /**
   * @param {import('selenium-webdriver').WebDriver} driver
   * @param {string} screenName
   */
  constructor(driver, screenName = "BasePage") {
    this.driver  = driver;
    this.timeout = CONFIG.EXPLICIT_WAIT;
    this.screenName = screenName;
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────
  async open(url) {
    Logger.info(`[${this.screenName}] Navigating to: ${url}`);
    await this.driver.get(url);
    await this.driver.sleep(500);
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async getPageTitle() {
    return await this.driver.getTitle();
  }

  async getPageSource() {
    return await this.driver.getPageSource();
  }

  // ─── Auto-Healing findElement ────────────────────────────────────────────────
  /**
   * Auto-Healing Selector Engine:
   *   1) Primary locator
   *   2) CSS fallback  (data-testid / id / name / class)
   *   3) XPath text fallback
   *   4) Text-content walking fallback
   */
  async findHealed(primaryLocator, healingHint = null, timeout = this.timeout) {
    // Step 1 — try primary
    try {
      await this.driver.wait(until.elementLocated(primaryLocator), Math.min(3000, timeout));
      const el = await this.driver.findElement(primaryLocator);
      await this.driver.wait(until.elementIsVisible(el), 3000);
      return el;
    } catch (_) {
      Logger.warn(`[Auto-Heal] Primary locator failed: ${primaryLocator}. Attempting fallbacks…`);
    }

    if (!healingHint) throw new Error(`Element not found and no healing hint provided: ${primaryLocator}`);

    // Step 2 — CSS attribute fuzzy
    const cssCandidates = [
      `[data-testid*="${healingHint}"]`,
      `[id*="${healingHint}"]`,
      `[name*="${healingHint}"]`,
      `[class*="${healingHint}"]`,
      `[aria-label*="${healingHint}"]`,
      `[placeholder*="${healingHint}"]`,
    ];
    for (const css of cssCandidates) {
      try {
        const el = await this.driver.findElement(By.css(css));
        Logger.info(`[Auto-Heal] ✅ Restored via CSS: ${css}`);
        return el;
      } catch (_) { /* continue */ }
    }

    // Step 3 — XPath text
    const xpathCandidates = [
      `//*[contains(text(),'${healingHint}')]`,
      `//*[contains(@aria-label,'${healingHint}')]`,
      `//*[contains(@title,'${healingHint}')]`,
      `//*[@value='${healingHint}']`,
    ];
    for (const xp of xpathCandidates) {
      try {
        const el = await this.driver.findElement(By.xpath(xp));
        Logger.info(`[Auto-Heal] ✅ Restored via XPath: ${xp}`);
        return el;
      } catch (_) { /* continue */ }
    }

    // Step 4 — JS DOM walk
    try {
      const el = await this.driver.executeScript(`
        const hint = arguments[0].toLowerCase();
        const all = document.querySelectorAll('button, a, input, [role="button"], li, span, div');
        for (const node of all) {
          if (
            node.textContent.toLowerCase().includes(hint) ||
            (node.value && node.value.toLowerCase().includes(hint)) ||
            (node.placeholder && node.placeholder.toLowerCase().includes(hint))
          ) { return node; }
        }
        return null;
      `, healingHint);
      if (el) {
        Logger.info(`[Auto-Heal] ✅ Restored via JS DOM walk for hint: "${healingHint}"`);
        return el;
      }
    } catch (_) { /* continue */ }

    throw new Error(`[Auto-Heal] All fallbacks exhausted for: "${healingHint}"`);
  }

  // ─── Core Interactions ───────────────────────────────────────────────────────
  async find(locator, timeout = this.timeout) {
    await this.driver.wait(until.elementLocated(locator), timeout);
    const el = await this.driver.findElement(locator);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    return el;
  }

  async findAll(locator) {
    await this.driver.sleep(300);
    return await this.driver.findElements(locator);
  }

  async click(locator, useJS = false) {
    const el = await this.find(locator);
    if (useJS) {
      await this.driver.executeScript("arguments[0].click();", el);
    } else {
      await el.click();
    }
  }

  async type(locator, text) {
    const el = await this.find(locator);
    await el.clear();
    await el.sendKeys(text);
  }

  async typeSlowly(locator, text, delayMs = 50) {
    const el = await this.find(locator);
    await el.clear();
    for (const char of text) {
      await el.sendKeys(char);
      await this.driver.sleep(delayMs);
    }
  }

  async getText(locator) {
    const el = await this.find(locator);
    return await el.getText();
  }

  async getValue(locator) {
    const el = await this.find(locator);
    return await el.getAttribute("value");
  }

  async isDisplayed(locator) {
    try {
      const el = await this.driver.findElement(locator);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  async isEnabled(locator) {
    try {
      const el = await this.driver.findElement(locator);
      return await el.isEnabled();
    } catch {
      return false;
    }
  }

  async waitForUrl(urlFragment, timeout = this.timeout) {
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      return url.includes(urlFragment);
    }, timeout, `URL did not include "${urlFragment}" within ${timeout}ms`);
  }

  async waitForElement(locator, timeout = this.timeout) {
    await this.driver.wait(until.elementLocated(locator), timeout);
    return await this.driver.findElement(locator);
  }

  async waitForTextPresent(locator, text, timeout = this.timeout) {
    await this.driver.wait(until.elementTextContains(
      await this.driver.findElement(locator), text
    ), timeout);
  }

  async scrollToElement(locator) {
    const el = await this.find(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
    await this.driver.sleep(200);
  }

  async scrollToBottom() {
    await this.driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await this.driver.sleep(300);
  }

  async scrollToTop() {
    await this.driver.executeScript("window.scrollTo(0, 0);");
    await this.driver.sleep(200);
  }

  async hoverOver(locator) {
    const el = await this.find(locator);
    const actions = this.driver.actions({ async: true });
    await actions.move({ origin: el }).perform();
  }

  async pressKey(key) {
    const body = await this.driver.findElement(By.css("body"));
    await body.sendKeys(key);
  }

  async clearStorage() {
    await this.driver.executeScript("window.localStorage.clear(); window.sessionStorage.clear();");
    await this.driver.manage().deleteAllCookies();
  }

  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }

  // ─── Viewport Management ─────────────────────────────────────────────────────
  async setViewport(width, height) {
    await this.driver.manage().window().setRect({ width, height });
    await this.driver.sleep(500);
  }

  async setDesktopViewport() {
    await this.setViewport(CONFIG.DESKTOP.width, CONFIG.DESKTOP.height);
  }

  async setTabletViewport() {
    await this.setViewport(CONFIG.TABLET.width, CONFIG.TABLET.height);
  }

  async setMobileViewport() {
    await this.setViewport(CONFIG.MOBILE.width, CONFIG.MOBILE.height);
  }

  // ─── Body Text ───────────────────────────────────────────────────────────────
  async getBodyText() {
    const body = await this.driver.findElement(By.css("body"));
    return await body.getText();
  }

  async getElementCount(locator) {
    const els = await this.driver.findElements(locator);
    return els.length;
  }

  // ─── Screenshots ─────────────────────────────────────────────────────────────
  async screenshot(label) {
    return await ScreenshotUtility.take(this.driver, label);
  }

  async screenshotOnFailure(testId) {
    return await ScreenshotUtility.take(this.driver, `FAIL_${testId}`);
  }

  // ─── Sleep ───────────────────────────────────────────────────────────────────
  async sleep(ms) {
    await this.driver.sleep(ms);
  }
}

/**
 * DashboardPage.js — Page Object Model
 * Well Care Hospital AI Patient Monitoring System
 */

import { By } from "selenium-webdriver";
import BasePage from "./BasePage.js";

export default class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver, "DashboardPage");
    this.sidebarNav    = By.css("nav, aside, [class*='sidebar'], [class*='Sidebar']");
    this.mainContent   = By.css("main, [class*='main'], [class*='content'], [class*='dashboard']");
    this.statsCards    = By.css("[class*='card'], [class*='Card'], [class*='stat'], [class*='metric']");
    this.patientCount  = By.xpath("//*[contains(text(),'Patient') or contains(text(),'patient')]");
    this.alertBadge    = By.xpath("//*[contains(text(),'Alert') or contains(text(),'alert')]");
    this.navItems      = By.css("li[class*='cursor'], li[class*='nav'], [class*='menu-item'], [class*='nav-item']");
    this.logoutBtn     = By.xpath("//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'sign out') or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'logout')]");
    this.searchInput   = By.css("input[type='search'], input[placeholder*='search'], input[placeholder*='Search']");
    this.chartElements = By.css("canvas, svg, [class*='chart'], [class*='Chart']");
  }

  async isSidebarVisible() { return await this.isDisplayed(this.sidebarNav); }
  async isMainContentVisible() { return await this.isDisplayed(this.mainContent); }

  async getStatCardCount() { return await this.getElementCount(this.statsCards); }
  async getNavItemCount()  { return await this.getElementCount(this.navItems); }
  async getChartCount()    { return await this.getElementCount(this.chartElements); }

  /**
   * Navigate to a screen by clicking the matching sidebar/menu item
   * @param {string} screenKey — e.g. "patients", "dashboard", "alerts"
   */
  async navigateTo(screenKey, screenLabel) {
    const candidates = [
      By.xpath(`//li[@key='${screenKey}']`),
      By.xpath(`//*[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${screenLabel.toLowerCase()}')]`),
      By.css(`[data-page='${screenKey}']`),
    ];

    for (const loc of candidates) {
      try {
        const els = await this.driver.findElements(loc);
        if (els.length > 0) {
          await this.driver.executeScript("arguments[0].click();", els[0]);
          await this.driver.sleep(600);
          return true;
        }
      } catch { /* try next */ }
    }

    // JS DOM walk fallback
    await this.driver.executeScript(`
      const label = arguments[0].toLowerCase();
      const items = document.querySelectorAll('li, button, a, [role="menuitem"]');
      for (const el of items) {
        if (el.textContent.toLowerCase().includes(label)) { el.click(); break; }
      }
    `, screenLabel);
    await this.driver.sleep(600);
    return true;
  }

  async logout() {
    try {
      const btn = await this.findHealed(this.logoutBtn, "sign out");
      await this.driver.executeScript("arguments[0].click();", btn);
      await this.driver.sleep(1000);
    } catch { /* ignore if not visible */ }
  }

  async expandCategory(catName) {
    try {
      const el = await this.driver.findElement(
        By.xpath(`//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${catName.toLowerCase()}')]`)
      );
      await this.driver.executeScript("arguments[0].click();", el);
      await this.driver.sleep(300);
    } catch { /* category already open or not found */ }
  }

  async getBodyText() {
    const body = await this.driver.findElement(By.css("body"));
    return await body.getText();
  }
}

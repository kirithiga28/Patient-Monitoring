/**
 * LoginPage.js — Page Object Model
 * Well Care Hospital AI Patient Monitoring System
 * Covers: Login Screen — TC01–TC10
 */

import { By } from "selenium-webdriver";
import BasePage from "./BasePage.js";
import { CONFIG } from "../config/selenium.config.js";

export default class LoginPage extends BasePage {
  constructor(driver) {
    super(driver, "LoginPage");
    // Selectors
    this.emailInput   = By.css("input[type='email']");
    this.passwordInput= By.css("input[type='password']");
    this.submitBtn    = By.css("button[type='submit']");
    this.errorMsg     = By.css(".error-message, [class*='error'], [class*='alert'], [role='alert']");
    this.signUpLink   = By.xpath("//*[contains(text(),'Sign Up') or contains(text(),'Register')]");
    this.forgotPwd    = By.xpath("//*[contains(text(),'Forgot') or contains(text(),'forgot')]");
    this.logoEl       = By.css("[class*='logo'], [class*='brand'], img[alt*='Well'], img[alt*='Care']");
    this.formEl       = By.css("form");
    this.pageHeading  = By.xpath("//*[contains(text(),'Well Care') or contains(text(),'Login') or contains(text(),'Sign In')]");
  }

  get url() { return CONFIG.LOCAL_URL || CONFIG.FRONTEND_URL; }

  async open() {
    await super.open(this.url);
    await this.driver.sleep(1500);
  }

  async enterEmail(email) {
    const el = await this.findHealed(this.emailInput, "email");
    await el.clear();
    await el.sendKeys(email);
  }

  async enterPassword(pwd) {
    const el = await this.findHealed(this.passwordInput, "password");
    await el.clear();
    await el.sendKeys(pwd);
  }

  async clickSubmit() {
    const btn = await this.findHealed(this.submitBtn, "sign in");
    await this.driver.executeScript("arguments[0].click();", btn);
  }

  /**
   * Full login flow with screenshot on success
   */
  async login(email = CONFIG.ADMIN_EMAIL, password = CONFIG.ADMIN_PASSWORD) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickSubmit();
    // Wait for dashboard indicator
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      const src = await this.driver.getPageSource();
      return url.includes("dashboard") || src.includes("Well Care") || src.includes("Dashboard");
    }, CONFIG.EXPLICIT_WAIT);
  }

  async getErrorText() {
    try {
      const el = await this.driver.findElement(this.errorMsg);
      return await el.getText();
    } catch {
      return "";
    }
  }

  async isFormPresent() {
    return await this.isDisplayed(this.formEl);
  }

  async isEmailInputVisible() {
    return await this.isDisplayed(this.emailInput);
  }

  async isPasswordInputVisible() {
    return await this.isDisplayed(this.passwordInput);
  }

  async isSubmitButtonVisible() {
    return await this.isDisplayed(this.submitBtn);
  }

  async isSubmitButtonEnabled() {
    return await this.isEnabled(this.submitBtn);
  }

  async clearEmail() {
    const el = await this.find(this.emailInput);
    await el.clear();
  }

  async clearPassword() {
    const el = await this.find(this.passwordInput);
    await el.clear();
  }

  async getHeadingText() {
    try {
      const el = await this.driver.findElement(this.pageHeading);
      return await el.getText();
    } catch {
      return await this.getPageTitle();
    }
  }

  async countInputFields() {
    return await this.getElementCount(By.css("input"));
  }

  async countButtons() {
    return await this.getElementCount(By.css("button"));
  }
}

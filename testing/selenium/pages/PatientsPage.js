/**
 * PatientsPage.js — Page Object Model
 * Well Care Hospital AI Patient Monitoring System — Patients Directory
 */
import { By } from "selenium-webdriver";
import BasePage from "./BasePage.js";

export default class PatientsPage extends BasePage {
  constructor(driver) {
    super(driver, "PatientsPage");
    this.searchInput   = By.css("input[type='search'], input[placeholder*='earch'], input[placeholder*='atient']");
    this.patientRows   = By.css("tr[class*='patient'], [class*='patient-row'], tbody tr, [class*='PatientCard']");
    this.addPatientBtn = By.xpath("//*[contains(text(),'Add Patient') or contains(text(),'Register') or contains(text(),'New Patient')]");
    this.tableHeaders  = By.css("thead th, [class*='table-header'] th");
    this.filterDropdown= By.css("select, [class*='filter'], [class*='dropdown']");
    this.pagination    = By.css("[class*='pagination'], [class*='Pagination']");
    this.noDataMsg     = By.xpath("//*[contains(text(),'No patients') or contains(text(),'No data') or contains(text(),'Empty')]");
    this.patientLink   = By.css("[class*='patient-name'], [class*='PatientName'], tbody td:first-child a, tbody td:first-child button");
  }

  async search(query) {
    const el = await this.findHealed(this.searchInput, "search");
    await el.clear();
    await el.sendKeys(query);
    await this.driver.sleep(500);
  }

  async getPatientCount()    { return await this.getElementCount(this.patientRows); }
  async isAddButtonVisible() { return await this.isDisplayed(this.addPatientBtn); }
  async isTableVisible()     { return await this.isDisplayed(By.css("table, [class*='table'], [class*='Table']")); }
  async getHeaderCount()     { return await this.getElementCount(this.tableHeaders); }

  async clickFirstPatient() {
    const links = await this.driver.findElements(this.patientLink);
    if (links.length > 0) {
      await this.driver.executeScript("arguments[0].click();", links[0]);
      await this.driver.sleep(600);
    }
  }

  async clickAddPatient() {
    const btn = await this.findHealed(this.addPatientBtn, "add patient");
    await this.driver.executeScript("arguments[0].click();", btn);
    await this.driver.sleep(500);
  }
}

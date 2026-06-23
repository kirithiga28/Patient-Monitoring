/**
 * ReportsPage.js — Page Object Model
 * Well Care Hospital AI Patient Monitoring System — Reports & Audits
 */
import { By } from "selenium-webdriver";
import BasePage from "./BasePage.js";

export default class ReportsPage extends BasePage {
  constructor(driver) {
    super(driver, "ReportsPage");
    this.reportsList     = By.css("[class*='report'], [class*='Report'], tbody tr");
    this.downloadBtn     = By.xpath("//*[contains(text(),'Download') or contains(text(),'Export') or contains(text(),'PDF')]");
    this.filterSelect    = By.css("select, [class*='filter']");
    this.dateRangeInput  = By.css("input[type='date'], [class*='datepicker'], [class*='DateRange']");
    this.generateBtn     = By.xpath("//*[contains(text(),'Generate') or contains(text(),'Create')]");
    this.tableContainer  = By.css("table, [class*='table'], [class*='Table']");
    this.chartContainer  = By.css("canvas, svg, [class*='chart']");
  }

  async getReportCount()     { return await this.getElementCount(this.reportsList); }
  async isTableVisible()     { return await this.isDisplayed(this.tableContainer); }
  async isChartVisible()     { return await this.isDisplayed(this.chartContainer); }
  async isDownloadAvailable(){ return await this.isDisplayed(this.downloadBtn); }

  async clickDownload() {
    const btn = await this.findHealed(this.downloadBtn, "download");
    await this.driver.executeScript("arguments[0].click();", btn);
    await this.driver.sleep(1000);
  }
}

// ─── PatientProfilePage ────────────────────────────────────────────────────────
export class PatientProfilePage extends BasePage {
  constructor(driver) {
    super(driver, "PatientProfilePage");
    this.profileHeader  = By.css("[class*='profile'], [class*='Profile'], [class*='PatientProfile']");
    this.patientName    = By.xpath("//*[contains(@class,'patient-name') or contains(@class,'PatientName')]");
    this.vitalsSection  = By.xpath("//*[contains(text(),'Vitals') or contains(text(),'vitals')]");
    this.tabButtons     = By.css("[role='tab'], [class*='tab-btn'], [class*='TabButton']");
    this.editBtn        = By.xpath("//*[contains(text(),'Edit') or contains(text(),'Update')]");
    this.backBtn        = By.xpath("//*[contains(text(),'Back') or contains(@class,'back')]");
    this.infoCards      = By.css("[class*='info-card'], [class*='InfoCard'], [class*='detail-card']");
  }
  async getTabCount()     { return await this.getElementCount(this.tabButtons); }
  async isProfileVisible(){ return await this.isDisplayed(this.profileHeader); }
  async getInfoCardCount(){ return await this.getElementCount(this.infoCards); }
}

// ─── MedicalRecordsPage ────────────────────────────────────────────────────────
export class MedicalRecordsPage extends BasePage {
  constructor(driver) {
    super(driver, "MedicalRecordsPage");
    this.recordsList = By.css("[class*='record'], tbody tr, [class*='MedicalRecord']");
    this.addRecordBtn= By.xpath("//*[contains(text(),'Add') or contains(text(),'New Record')]");
    this.searchInput = By.css("input[placeholder*='earch']");
    this.filterTabs  = By.css("[role='tab'], [class*='tab']");
  }
  async getRecordCount(){ return await this.getElementCount(this.recordsList); }
}

// ─── PatientVitalsPage ────────────────────────────────────────────────────────
export class PatientVitalsPage extends BasePage {
  constructor(driver) {
    super(driver, "PatientVitalsPage");
    this.vitalsCards   = By.css("[class*='vital'], [class*='Vital'], [class*='metric-card']");
    this.chartCanvas   = By.css("canvas");
    this.heartRate     = By.xpath("//*[contains(text(),'Heart Rate') or contains(text(),'BPM')]");
    this.bloodPressure = By.xpath("//*[contains(text(),'Blood Pressure') or contains(text(),'BP')]");
    this.oxygen        = By.xpath("//*[contains(text(),'Oxygen') or contains(text(),'SpO2')]");
    this.temperature   = By.xpath("//*[contains(text(),'Temperature') or contains(text(),'Temp')]");
    this.refreshBtn    = By.xpath("//*[contains(text(),'Refresh') or contains(@class,'refresh')]");
  }
  async getVitalCardCount() { return await this.getElementCount(this.vitalsCards); }
  async getChartCount()     { return await this.getElementCount(this.chartCanvas); }
  async isHeartRateVisible(){ return await this.isDisplayed(this.heartRate); }
}

// ─── LiveMonitoringPage ───────────────────────────────────────────────────────
export class LiveMonitoringPage extends BasePage {
  constructor(driver) {
    super(driver, "LiveMonitoringPage");
    this.cameraFeeds   = By.css("[class*='camera'], [class*='Camera'], [class*='feed'], video");
    this.streamStatus  = By.xpath("//*[contains(text(),'Live') or contains(text(),'Online') or contains(text(),'Streaming')]");
    this.fullscreenBtn = By.xpath("//*[contains(text(),'Fullscreen') or contains(@class,'fullscreen')]");
    this.cameraGrid    = By.css("[class*='grid'], [class*='camera-grid']");
  }
  async getCameraFeedCount()  { return await this.getElementCount(this.cameraFeeds); }
  async isCameraGridVisible() { return await this.isDisplayed(this.cameraGrid); }
}

// ─── CamerasManagerPage ───────────────────────────────────────────────────────
export class CamerasManagerPage extends BasePage {
  constructor(driver) {
    super(driver, "CamerasManagerPage");
    this.cameraCards    = By.css("[class*='camera-card'], [class*='CameraCard'], [class*='camera']");
    this.addCameraBtn   = By.xpath("//*[contains(text(),'Add Camera') or contains(text(),'New Camera')]");
    this.statusBadges   = By.css("[class*='status'], [class*='badge'], [class*='Status']");
    this.searchInput    = By.css("input[placeholder*='earch']");
  }
  async getCameraCardCount()  { return await this.getElementCount(this.cameraCards); }
  async getStatusBadgeCount() { return await this.getElementCount(this.statusBadges); }
}

// ─── AlertsPage ───────────────────────────────────────────────────────────────
export class AlertsPage extends BasePage {
  constructor(driver) {
    super(driver, "AlertsPage");
    this.alertRows      = By.css("[class*='alert-row'], tbody tr, [class*='AlertItem']");
    this.criticalBadges = By.xpath("//*[contains(text(),'Critical') or contains(text(),'critical')]");
    this.filterBtns     = By.css("[class*='filter-btn'], [role='tab']");
    this.acknowledgeBtn = By.xpath("//*[contains(text(),'Acknowledge') or contains(text(),'Resolve')]");
    this.searchInput    = By.css("input[placeholder*='earch']");
  }
  async getAlertCount()     { return await this.getElementCount(this.alertRows); }
  async getCriticalCount()  { return await this.getElementCount(this.criticalBadges); }
}

// ─── EmergencyAlertsPage ─────────────────────────────────────────────────────
export class EmergencyAlertsPage extends BasePage {
  constructor(driver) {
    super(driver, "EmergencyAlertsPage");
    this.emergencyPanel  = By.css("[class*='emergency'], [class*='Emergency']");
    this.sosButton       = By.xpath("//*[contains(text(),'SOS') or contains(text(),'Emergency')]");
    this.alertList       = By.css("[class*='alert-list'], [class*='EmergencyList'], tbody tr");
    this.statusIndicator = By.css("[class*='status-indicator'], [class*='pulse']");
  }
  async getAlertCount() { return await this.getElementCount(this.alertList); }
  async isPanelVisible(){ return await this.isDisplayed(this.emergencyPanel); }
}

// ─── NotificationCenterPage ───────────────────────────────────────────────────
export class NotificationCenterPage extends BasePage {
  constructor(driver) {
    super(driver, "NotificationCenterPage");
    this.notifications  = By.css("[class*='notification'], [class*='Notification'], [class*='notif']");
    this.markAllRead    = By.xpath("//*[contains(text(),'Mark All') or contains(text(),'Clear All')]");
    this.filterTabs     = By.css("[role='tab'], [class*='tab']");
    this.unreadBadge    = By.css("[class*='unread'], [class*='badge']");
  }
  async getNotificationCount() { return await this.getElementCount(this.notifications); }
}

// ─── AppointmentsPage ────────────────────────────────────────────────────────
export class AppointmentsPage extends BasePage {
  constructor(driver) {
    super(driver, "AppointmentsPage");
    this.appointmentCards = By.css("[class*='appointment'], tbody tr, [class*='Appointment']");
    this.newApptBtn       = By.xpath("//*[contains(text(),'New Appointment') or contains(text(),'Schedule')]");
    this.calendarView     = By.css("[class*='calendar'], [class*='Calendar']");
    this.listView         = By.css("[class*='list-view'], table");
    this.statusFilter     = By.css("select, [class*='filter']");
  }
  async getAppointmentCount() { return await this.getElementCount(this.appointmentCards); }
  async isCalendarVisible()   { return await this.isDisplayed(this.calendarView); }
}

// ─── ICUMonitoringPage ────────────────────────────────────────────────────────
export class ICUMonitoringPage extends BasePage {
  constructor(driver) {
    super(driver, "ICUMonitoringPage");
    this.patientBeds    = By.css("[class*='bed'], [class*='Bed'], [class*='icu-bed']");
    this.vitalsMonitors = By.css("[class*='vital'], [class*='monitor'], canvas");
    this.alertPanel     = By.css("[class*='alert'], [class*='Alert']");
    this.bedCount       = By.xpath("//*[contains(text(),'Bed') or contains(text(),'beds')]");
  }
  async getBedCount()    { return await this.getElementCount(this.patientBeds); }
  async getMonitorCount(){ return await this.getElementCount(this.vitalsMonitors); }
}

// ─── ObservationWardPage ──────────────────────────────────────────────────────
export class ObservationWardPage extends BasePage {
  constructor(driver) {
    super(driver, "ObservationWardPage");
    this.patientCards  = By.css("[class*='patient-card'], [class*='observation'], tbody tr");
    this.wardBeds      = By.css("[class*='ward-bed'], [class*='bed-slot']");
    this.statusWidget  = By.css("[class*='status'], [class*='Status']");
  }
  async getPatientCardCount() { return await this.getElementCount(this.patientCards); }
}

// ─── CriticalPatientPage ──────────────────────────────────────────────────────
export class CriticalPatientPage extends BasePage {
  constructor(driver) {
    super(driver, "CriticalPatientPage");
    this.patientMonitors = By.css("[class*='critical'], [class*='Critical'], [class*='monitor']");
    this.vitalsDisplay   = By.css("[class*='vital'], canvas");
    this.alertIndicators = By.css("[class*='alert'], [class*='alarm']");
  }
  async getMonitorCount() { return await this.getElementCount(this.patientMonitors); }
}

// ─── ActivityHistoryPage ──────────────────────────────────────────────────────
export class ActivityHistoryPage extends BasePage {
  constructor(driver) {
    super(driver, "ActivityHistoryPage");
    this.activityList   = By.css("[class*='activity'], [class*='Activity'], tbody tr, [class*='timeline']");
    this.filterSelect   = By.css("select, [class*='filter']");
    this.dateFilter     = By.css("input[type='date'], [class*='datepicker']");
    this.searchInput    = By.css("input[placeholder*='earch']");
    this.exportBtn      = By.xpath("//*[contains(text(),'Export') or contains(text(),'Download')]");
  }
  async getActivityCount() { return await this.getElementCount(this.activityList); }
  async isExportAvailable(){ return await this.isDisplayed(this.exportBtn); }
}

// ─── AIPredictionPage ────────────────────────────────────────────────────────
export class AIPredictionPage extends BasePage {
  constructor(driver) {
    super(driver, "AIPredictionPage");
    this.predictionCards = By.css("[class*='prediction'], [class*='Prediction'], tbody tr");
    this.chartCanvas     = By.css("canvas, svg");
    this.modelStatus     = By.xpath("//*[contains(text(),'AI') or contains(text(),'Model') or contains(text(),'Prediction')]");
    this.confidenceScore = By.xpath("//*[contains(text(),'Confidence') or contains(text(),'Score') or contains(text(),'%')]");
    this.filterBtns      = By.css("[role='tab'], [class*='tab'], [class*='filter']");
  }
  async getPredictionCount() { return await this.getElementCount(this.predictionCards); }
  async getChartCount()      { return await this.getElementCount(this.chartCanvas); }
  async isAIStatusVisible()  { return await this.isDisplayed(this.modelStatus); }
}

// ─── PoseTestingPage ─────────────────────────────────────────────────────────
export class PoseTestingPage extends BasePage {
  constructor(driver) {
    super(driver, "PoseTestingPage");
    this.cameraFeed   = By.css("video, canvas, [class*='pose'], [class*='camera']");
    this.checkList    = By.css("[class*='checklist'], [class*='criteria'], ul li");
    this.startBtn     = By.xpath("//*[contains(text(),'Start') or contains(text(),'Begin') or contains(text(),'Test')]");
    this.resultsPanel = By.css("[class*='result'], [class*='Result']");
    this.statusBadge  = By.css("[class*='status'], [class*='badge']");
  }
  async getChecklistCount()  { return await this.getElementCount(this.checkList); }
  async isCameraFeedVisible(){ return await this.isDisplayed(this.cameraFeed); }
}

// ─── SettingsPage ────────────────────────────────────────────────────────────
export class SettingsPage extends BasePage {
  constructor(driver) {
    super(driver, "SettingsPage");
    this.settingsSections = By.css("[class*='settings-section'], [class*='SettingsSection'], [class*='card']");
    this.toggleSwitches   = By.css("input[type='checkbox'], [role='switch'], [class*='toggle']");
    this.saveBtn          = By.xpath("//*[contains(text(),'Save') or contains(text(),'Update Settings')]");
    this.inputFields      = By.css("input, select, textarea");
    this.themeToggle      = By.xpath("//*[contains(text(),'Dark') or contains(text(),'Theme') or contains(text(),'Mode')]");
  }
  async getSectionCount()  { return await this.getElementCount(this.settingsSections); }
  async getToggleCount()   { return await this.getElementCount(this.toggleSwitches); }
  async isSaveVisible()    { return await this.isDisplayed(this.saveBtn); }
}

// ─── AdminPages ──────────────────────────────────────────────────────────────
export class DoctorsPage extends BasePage {
  constructor(driver) {
    super(driver, "DoctorsPage");
    this.doctorCards = By.css("[class*='doctor'], [class*='Doctor'], tbody tr");
    this.addBtn      = By.xpath("//*[contains(text(),'Add Doctor') or contains(text(),'New Doctor')]");
    this.searchInput = By.css("input[placeholder*='earch']");
  }
  async getDoctorCount() { return await this.getElementCount(this.doctorCards); }
}

export class NursesPage extends BasePage {
  constructor(driver) {
    super(driver, "NursesPage");
    this.nurseCards  = By.css("[class*='nurse'], [class*='Nurse'], tbody tr");
    this.addBtn      = By.xpath("//*[contains(text(),'Add Nurse') or contains(text(),'New Nurse')]");
    this.searchInput = By.css("input[placeholder*='earch']");
  }
  async getNurseCount() { return await this.getElementCount(this.nurseCards); }
}

export class BedManagementPage extends BasePage {
  constructor(driver) {
    super(driver, "BedManagementPage");
    this.bedCards    = By.css("[class*='bed-card'], [class*='BedCard'], [class*='bed']");
    this.availBeds   = By.xpath("//*[contains(text(),'Available') or contains(text(),'available')]");
    this.occupiedBeds= By.xpath("//*[contains(text(),'Occupied') or contains(text(),'occupied')]");
  }
  async getBedCount() { return await this.getElementCount(this.bedCards); }
}

export class AddPatientPage extends BasePage {
  constructor(driver) {
    super(driver, "AddPatientPage");
    this.firstNameInput = By.css("input[name*='first'], input[placeholder*='irst']");
    this.lastNameInput  = By.css("input[name*='last'], input[placeholder*='ast']");
    this.emailInput     = By.css("input[type='email']");
    this.phoneInput     = By.css("input[type='tel'], input[name*='phone']");
    this.genderSelect   = By.css("select[name*='gender'], [class*='gender']");
    this.dobInput       = By.css("input[type='date'], input[name*='dob']");
    this.submitBtn      = By.css("button[type='submit']");
    this.formFields     = By.css("input, select, textarea");
    this.requiredFields = By.css("[required], [aria-required='true']");
  }
  async getFieldCount()    { return await this.getElementCount(this.formFields); }
  async getRequiredCount() { return await this.getElementCount(this.requiredFields); }
  async isSubmitEnabled()  { return await this.isEnabled(this.submitBtn); }
}

export class UserManagementPage extends BasePage {
  constructor(driver) {
    super(driver, "UserManagementPage");
    this.userRows    = By.css("tbody tr, [class*='user-row']");
    this.addUserBtn  = By.xpath("//*[contains(text(),'Add User') or contains(text(),'Invite')]");
    this.roleFilter  = By.css("select, [class*='role-filter']");
    this.searchInput = By.css("input[placeholder*='earch']");
  }
  async getUserCount() { return await this.getElementCount(this.userRows); }
}

export class DeviceManagementPage extends BasePage {
  constructor(driver) {
    super(driver, "DeviceManagementPage");
    this.deviceCards  = By.css("[class*='device'], [class*='Device'], tbody tr");
    this.onlineCount  = By.xpath("//*[contains(text(),'Online') or contains(text(),'Connected')]");
    this.addDeviceBtn = By.xpath("//*[contains(text(),'Add Device') or contains(text(),'Register Device')]");
    this.statusFilter = By.css("select, [class*='filter']");
  }
  async getDeviceCount() { return await this.getElementCount(this.deviceCards); }
}

export class AnalyticsDashboardPage extends BasePage {
  constructor(driver) {
    super(driver, "AnalyticsDashboardPage");
    this.charts       = By.css("canvas, svg, [class*='chart']");
    this.statCards    = By.css("[class*='stat'], [class*='metric'], [class*='card']");
    this.dateFilter   = By.css("input[type='date'], [class*='datepicker']");
    this.exportBtn    = By.xpath("//*[contains(text(),'Export') or contains(text(),'Download')]");
  }
  async getChartCount() { return await this.getElementCount(this.charts); }
  async getCardCount()  { return await this.getElementCount(this.statCards); }
}

export class AuditLogsPage extends BasePage {
  constructor(driver) {
    super(driver, "AuditLogsPage");
    this.logRows     = By.css("tbody tr, [class*='log-row'], [class*='audit']");
    this.searchInput = By.css("input[placeholder*='earch']");
    this.dateRange   = By.css("input[type='date']");
    this.exportBtn   = By.xpath("//*[contains(text(),'Export') or contains(text(),'Download')]");
    this.filterTabs  = By.css("[role='tab'], [class*='tab']");
  }
  async getLogCount() { return await this.getElementCount(this.logRows); }
}

export class SystemOverviewPage extends BasePage {
  constructor(driver) {
    super(driver, "SystemOverviewPage");
    this.statusCards    = By.css("[class*='status-card'], [class*='system-card'], [class*='card']");
    this.serviceStatus  = By.xpath("//*[contains(text(),'Service') or contains(text(),'Status') or contains(text(),'Online')]");
    this.uptimeDisplay  = By.xpath("//*[contains(text(),'Uptime') or contains(text(),'uptime')]");
    this.refreshBtn     = By.xpath("//*[contains(text(),'Refresh') or contains(@class,'refresh')]");
  }
  async getStatusCardCount() { return await this.getElementCount(this.statusCards); }
}

export class MobileQRPage extends BasePage {
  constructor(driver) {
    super(driver, "MobileQRPage");
    this.qrCode      = By.css("[class*='qr'], img[class*='qr'], canvas[class*='qr'], [class*='QR']");
    this.instructions = By.xpath("//*[contains(text(),'Scan') or contains(text(),'QR') or contains(text(),'Mobile')]");
    this.downloadBtn  = By.xpath("//*[contains(text(),'Download') or contains(text(),'Save')]");
  }
  async isQrVisible()           { return await this.isDisplayed(this.qrCode); }
  async isInstructionsVisible() { return await this.isDisplayed(this.instructions); }
}

export class StaffManagementPage extends BasePage {
  constructor(driver) {
    super(driver, "StaffManagementPage");
    this.staffCards  = By.css("[class*='staff'], tbody tr, [class*='StaffCard']");
    this.addBtn      = By.xpath("//*[contains(text(),'Add Staff') or contains(text(),'New Staff')]");
    this.searchInput = By.css("input[placeholder*='earch']");
    this.filterBtns  = By.css("[role='tab'], [class*='tab'], [class*='filter']");
  }
  async getStaffCount() { return await this.getElementCount(this.staffCards); }
}

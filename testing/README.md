# Well Care Hospital AI Patient Monitoring System
# Enterprise QA Automation Framework v2.0

> **640 Automated Test Cases** — 320 Selenium Web + 320 Appium Mobile  
> **32 Screens × 10 Test Cases Per Framework**

---

## 📁 Framework Structure

```
testing/
├── selenium/
│   ├── config/
│   │   └── selenium.config.js          # WebDriver config, Grid URL, env vars
│   ├── pages/                          # Page Object Model
│   │   ├── BasePage.js                 # Auto-healing selector engine + base interactions
│   │   ├── LoginPage.js                # Login screen POM
│   │   ├── DashboardPage.js            # Dashboard POM
│   │   ├── PatientsPage.js             # Patients directory POM
│   │   ├── AllPages.js                 # All remaining 28 screen POMs
│   │   └── ReportsPage.js              # Reports & Audits POM
│   ├── tests/
│   │   ├── webTests.js                 # 320 Selenium test cases (32×10)
│   │   └── LoginTest.js                # Deep login screen validation (TC01-TC10)
│   ├── utils/
│   │   ├── Logger.js                   # Structured JSON logger
│   │   ├── ScreenshotUtility.js        # Screenshot capture utility
│   │   ├── ExcelReportGenerator.js     # Excel report (.xlsx)
│   │   ├── HtmlReportGenerator.js      # HTML report with charts
│   │   └── ParallelRunner.js           # Grid-compatible parallel execution
│   ├── screenshots/                    # Auto-generated screenshots
│   ├── logs/                           # selenium-execution.log
│   ├── reports/                        # selenium-report.html, results.json
│   └── excel-reports/                  # selenium-analysis.xlsx
│
├── appium/
│   ├── tests/
│   │   └── mobileTests.js              # 320 Appium test cases (32×10)
│   ├── screenshots/                    # Mobile screenshots
│   ├── logs/                           # appium-execution.log
│   └── reports/                        # appium-report.html, results.json
│
├── common/
│   └── Dashboard.js                    # Consolidated QA dashboard generator
│
├── reporter.js                         # Unified report compiler
├── package.json
└── README.md
```

---

## 🧪 Test Suites

### Selenium — 320 Web Test Cases

| # | Screen | Module | TC01-TC10 |
|---|--------|--------|-----------|
| 01 | Login | Authentication | ✅ TC01–TC10 |
| 02 | Dashboard | Core Portal | ✅ TC01–TC10 |
| 03 | Patients Directory | Patient Management | ✅ TC01–TC10 |
| 04 | Patient Profile | Patient Management | ✅ TC01–TC10 |
| 05 | Register Patient | Patient Management | ✅ TC01–TC10 |
| 06 | Medical Records | Patient Management | ✅ TC01–TC10 |
| 07 | Patient Vitals | Patient Management | ✅ TC01–TC10 |
| 08 | Live Monitoring | Monitoring & AI | ✅ TC01–TC10 |
| 09 | Cameras Manager | Monitoring & AI | ✅ TC01–TC10 |
| 10 | Alerts Incident Log | Clinical Operations | ✅ TC01–TC10 |
| 11 | Emergency Alerts | Clinical Operations | ✅ TC01–TC10 |
| 12 | Notification Center | Clinical Operations | ✅ TC01–TC10 |
| 13 | Appointments | Clinical Operations | ✅ TC01–TC10 |
| 14 | ICU Monitoring | Monitoring & AI | ✅ TC01–TC10 |
| 15 | Observation Ward | Monitoring & AI | ✅ TC01–TC10 |
| 16 | Critical Patient Monitor | Monitoring & AI | ✅ TC01–TC10 |
| 17 | Activity History | Monitoring & AI | ✅ TC01–TC10 |
| 18 | AI Prediction Matrix | Monitoring & AI | ✅ TC01–TC10 |
| 19 | Pose Testing Suite | Monitoring & AI | ✅ TC01–TC10 |
| 20 | Reports & Audits | Administration | ✅ TC01–TC10 |
| 21 | System Settings | System Module | ✅ TC01–TC10 |
| 22 | Doctors Directory | Administration | ✅ TC01–TC10 |
| 23 | Nurses Directory | Administration | ✅ TC01–TC10 |
| 24 | Bed Management | Administration | ✅ TC01–TC10 |
| 25 | Staff Management | Administration | ✅ TC01–TC10 |
| 26 | User Management | Administration | ✅ TC01–TC10 |
| 27 | Device Management | Administration | ✅ TC01–TC10 |
| 28 | Analytics Dashboard | Administration | ✅ TC01–TC10 |
| 29 | Audit Logs | System Module | ✅ TC01–TC10 |
| 30 | System Overview | System Module | ✅ TC01–TC10 |
| 31 | Mobile Access QR | System Module | ✅ TC01–TC10 |
| 32 | Sign Up | Authentication | ✅ TC01–TC10 |

### Test Case Definitions

| TC | Name | Description |
|----|------|-------------|
| TC01 | Screen Load Validation | Verifies page body content loads successfully |
| TC02 | Page Title Validation | Checks browser tab title is non-empty |
| TC03 | Navigation Validation | Counts interactive navigation elements |
| TC04 | UI Elements Validation | Validates containers, headings, structure |
| TC05 | Button Functionality Validation | Confirms buttons present and enabled |
| TC06 | Form Validation | Tests required fields and input constraints |
| TC07 | Data Rendering Validation | Checks tables, cards, charts, lists render |
| TC08 | Responsive Layout Validation | Tests 375px, 768px, 1920px viewports |
| TC09 | Error Handling Validation | Checks page source integrity and error boundaries |
| TC10 | End-to-End Workflow Validation | Full scroll, interaction, state verification |

---

## 📱 Appium — 320 Mobile Test Cases

Same 32 screens, 10 mobile-specific test cases each:

| TC | Name |
|----|------|
| TC01 | Launch App |
| TC02 | Login Validation |
| TC03 | Navigation Validation |
| TC04 | UI Validation |
| TC05 | Form Validation |
| TC06 | Data Validation |
| TC07 | API Integration Validation |
| TC08 | Responsive Validation |
| TC09 | Error Validation |
| TC10 | End-to-End Workflow |

---

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure Chrome is installed (for Selenium)
# Ensure Appium server running on port 4723 (for mobile)
# Ensure Android emulator/device connected (for Appium)
```

### Commands

```bash
# Run ALL 320 Selenium web tests
npm run test:selenium

# Run deep Login screen validation (10 TCs)
npm run test:login

# Run ALL 320 Appium mobile tests
npm run test:appium

# Run both suites sequentially (640 tests)
npm run test:all

# Run Selenium in parallel (uses available CPU cores)
npm run test:parallel

# Generate consolidated dashboard after tests
npm run dashboard

# Regenerate HTML + Excel from existing JSON results
npm run report
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SELENIUM_GRID_URL` | `null` | Selenium Grid hub URL (e.g. `http://localhost:4444`) |
| `TEST_EMAIL` | `test_admin@wellcare.com` | Login email |
| `TEST_PASSWORD` | `password123` | Login password |
| `APPIUM_PORT` | `4723` | Appium server port |
| `DEVICE_NAME` | `Android Emulator` | Android device name |
| `PLATFORM_VERSION` | `13` | Android version |
| `PARALLEL_WORKERS` | CPU count | Number of parallel browser workers |

---

## 🛡️ Auto-Healing Selector Engine

Located in `BasePage.js → findHealed()`. 4-tier fallback:

1. **Primary Locator** — Original CSS/XPath selector
2. **CSS Attribute Fuzzy** — `[data-testid*="hint"]`, `[id*="hint"]`, `[aria-label*="hint"]`
3. **XPath Text** — `//*[contains(text(),'hint')]`, `[contains(@aria-label,'hint')]`
4. **JS DOM Walk** — Iterates all interactive elements matching text/value/placeholder

---

## 📊 Reports Generated

After running tests, these reports are auto-generated:

| Report | Path | Description |
|--------|------|-------------|
| Selenium HTML | `selenium/reports/selenium-report.html` | Dark-mode report with Chart.js charts, live search/filter |
| Selenium JSON | `selenium/reports/results.json` | Raw structured JSON |
| Selenium Excel | `selenium/excel-reports/selenium-analysis.xlsx` | Multi-sheet xlsx with color coding |
| Appium HTML | `appium/reports/appium-report.html` | Mobile QA report |
| Appium JSON | `appium/reports/results.json` | Raw mobile results |
| Dashboard | `reports/dashboard.html` | Consolidated view: Selenium + Appium |
| Combined Excel | `excel-reports/selenium-analysis.xlsx` | All results in one workbook |

---

## 📸 Screenshots

Screenshots are captured automatically at:
- ✅ **Successful login** → `LOGIN_SUCCESS_*.png`
- 🏠 **Dashboard load** → `DASHBOARD_LOADED_*.png`
- 🗺️ **Every screen navigation** → `NAV_{screenName}_*.png`
- ❌ **Every test failure** → `FAIL_{testId}_*.png`
- 🏁 **End of test suite** → `SUITE_END_*.png`

Stored in: `selenium/screenshots/` and `appium/screenshots/`

---

## 🔧 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Selenium WebDriver | ^4.22.0 | Browser automation |
| Mocha | ^10.4.0 | Test runner |
| Chai | ^5.1.1 | Assertions |
| ExcelJS | ^4.4.0 | Excel report generation |
| Mochawesome | ^7.1.3 | HTML test reports |
| Appium | ^2.11.3 | Mobile automation |
| WebdriverIO | ^8.39.1 | Appium client |
| Chart.js | ^4.4.0 | Dashboard charts (CDN) |

---

## 🌐 Target Applications

| Environment | URL |
|-------------|-----|
| Frontend (Production) | https://patient-monitoring-qxjpim00j-wellcare.vercel.app/ |
| Frontend (Local Dev) | http://localhost:5173 |
| Backend API | https://wellcare-ai-backend.onrender.com |

> The framework auto-detects Vercel deployment protection and falls back to local dev server.

---

## ⚡ Parallel Execution (Selenium Grid)

```bash
# Start Selenium Grid Hub
java -jar selenium-server-standalone.jar hub

# Start Node(s)
java -jar selenium-server-standalone.jar node --hub http://localhost:4444

# Set Grid URL and run parallel
SELENIUM_GRID_URL=http://localhost:4444 npm run test:parallel
```

The parallel runner partitions 32 screens across available CPU workers, each spawning an independent Mocha process with screen-specific grep filters.

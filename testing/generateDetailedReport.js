import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

async function generateDetailedReport() {
  const finalReportsDir = path.resolve("final-reports");
  if (!fs.existsSync(finalReportsDir)) {
    fs.mkdirSync(finalReportsDir, { recursive: true });
  }

  const seleniumJsonPath = path.resolve("selenium/reports/results.json");
  const appiumJsonPath = path.resolve("appium/reports/results.json");

  console.log("Reading test execution files...");

  // Load Selenium results
  let seleniumResults = [];
  let seleniumGenDate = new Date().toISOString().split('T')[0];
  if (fs.existsSync(seleniumJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(seleniumJsonPath, "utf8"));
      seleniumResults = data.results || [];
      if (data.generatedAt) {
        seleniumGenDate = new Date(data.generatedAt).toISOString().split('T')[0];
      }
    } catch (e) {
      console.error("Error reading Selenium results.json:", e.message);
    }
  } else {
    console.warn("Selenium results.json not found at:", seleniumJsonPath);
  }

  // Load Appium results
  let appiumResults = [];
  let appiumGenDate = new Date().toISOString().split('T')[0];
  if (fs.existsSync(appiumJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(appiumJsonPath, "utf8"));
      appiumResults = data.results || [];
      if (data.generatedAt) {
        appiumGenDate = new Date(data.generatedAt).toISOString().split('T')[0];
      }
    } catch (e) {
      console.error("Error reading Appium results.json:", e.message);
    }
  } else {
    console.warn("Appium results.json not found at:", appiumJsonPath);
  }

  console.log(`Loaded ${seleniumResults.length} Selenium cases.`);
  console.log(`Loaded ${appiumResults.length} Appium cases.`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WellCare QA Framework";
  workbook.created = new Date();

  const borderStyle = { style: "thin", color: { argb: "FFD1D5DB" } };
  const cellBorder = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

  // Helper to format worksheets
  const formatWorksheet = (sheet, title, headers, rows) => {
    // Enable Freeze Panes for the first row (headers)
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Set columns configuration
    sheet.columns = headers.map(h => ({ header: h.name, key: h.key }));

    // Format Header Row (Row 1)
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = cellBorder;
    });

    // Add data rows
    rows.forEach((rowData, index) => {
      const row = sheet.addRow(rowData);
      row.height = 20;

      row.eachCell((cell, colNumber) => {
        cell.border = cellBorder;
        cell.font = { size: 9 };
        
        // Alignment
        if (colNumber === 1 || colNumber === 8 || colNumber === 9 || colNumber === 12) {
          // Test ID, Status, Execution Time, Date
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        }

        // Striped styling for odd data rows (excluding Status column)
        const statusKey = headers[colNumber - 1].key;
        if (index % 2 === 1 && statusKey !== "status") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFF" } };
        }

        // Highlight Status
        if (statusKey === "status") {
          const val = String(cell.value).toUpperCase();
          if (val === "PASS" || val === "PASSED") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } };
            cell.font = { color: { argb: "FF006100" }, bold: true, size: 9 };
          } else if (val === "FAIL" || val === "FAILED") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } };
            cell.font = { color: { argb: "FF9C0006" }, bold: true, size: 9 };
          }
        }
      });
    });

    // Auto-fit Column Widths (min 10, max 50)
    sheet.columns.forEach(column => {
      let maxLen = 12;
      column.eachCell({ includeHeader: true }, cell => {
        const valStr = cell.value ? String(cell.value) : "";
        // Don't count very long file paths or error messages for layout width to keep it neat
        if (valStr.length > maxLen && valStr.length < 60) {
          maxLen = valStr.length;
        }
      });
      column.width = Math.min(Math.max(maxLen + 4, 12), 50);
    });

    // Enable Autofilter
    const rangeLetter = String.fromCharCode(65 + headers.length - 1); // e.g. 'L' for 12 columns
    sheet.autoFilter = `A1:${rangeLetter}${rows.length + 1}`;
  };

  // Sheet 1: Selenium Detailed Results
  const seleniumHeaders = [
    { name: "Test ID", key: "testId" },
    { name: "Screen Name", key: "screenName" },
    { name: "Module Name", key: "moduleName" },
    { name: "Test Case Name", key: "testCaseName" },
    { name: "Test Description", key: "testDescription" },
    { name: "Expected Result", key: "expectedResult" },
    { name: "Actual Result", key: "actualResult" },
    { name: "Status (PASS / FAIL)", key: "status" },
    { name: "Execution Time", key: "executionTime" },
    { name: "Screenshot Path", key: "screenshotPath" },
    { name: "Error Message (if failed)", key: "errorMessage" },
    { name: "Execution Date", key: "executionDate" }
  ];

  const seleniumRows = seleniumResults.map(r => {
    const isPass = r.status === "PASSED" || r.status === "PASS";
    const status = isPass ? "PASS" : "FAIL";
    const execTimeSec = r.time ? (r.time / 1000).toFixed(2) + "s" : "0.00s";
    return {
      testId: r.testId || "",
      screenName: r.screen || "",
      moduleName: r.module || "",
      testCaseName: r.testCase || "",
      testDescription: r.expected || "N/A",
      expectedResult: r.expected || "",
      actualResult: r.actual || "",
      status: status,
      executionTime: execTimeSec,
      screenshotPath: r.screenshot || "N/A",
      errorMessage: isPass ? "N/A" : (r.actual || r.remarks || "Test failed"),
      executionDate: seleniumGenDate
    };
  });

  const sheet1 = workbook.addWorksheet("Selenium Detailed Results");
  formatWorksheet(sheet1, "Selenium Detailed Results", seleniumHeaders, seleniumRows);

  // Sheet 2: Appium Detailed Results
  const appiumHeaders = [
    { name: "Test ID", key: "testId" },
    { name: "Mobile Screen", key: "mobileScreen" },
    { name: "Module Name", key: "moduleName" },
    { name: "Test Case Name", key: "testCaseName" },
    { name: "Test Description", key: "testDescription" },
    { name: "Expected Result", key: "expectedResult" },
    { name: "Actual Result", key: "actualResult" },
    { name: "Status (PASS / FAIL)", key: "status" },
    { name: "Execution Time", key: "executionTime" },
    { name: "Screenshot Path", key: "screenshotPath" },
    { name: "Error Message (if failed)", key: "errorMessage" },
    { name: "Execution Date", key: "executionDate" }
  ];

  const appiumRows = appiumResults.map(r => {
    const isPass = r.status === "PASSED" || r.status === "PASS";
    const status = isPass ? "PASS" : "FAIL";
    const execTimeSec = r.duration ? (r.duration / 1000).toFixed(2) + "s" : "0.00s";
    return {
      testId: r.id || "",
      mobileScreen: r.screenName || "",
      moduleName: r.module || "",
      testCaseName: r.testName || "",
      testDescription: r.expected || "N/A",
      expectedResult: r.expected || "",
      actualResult: r.actual || "",
      status: status,
      executionTime: execTimeSec,
      screenshotPath: r.screenshot || "N/A",
      errorMessage: isPass ? "N/A" : (r.actual || r.remarks || "Test failed"),
      executionDate: appiumGenDate
    };
  });

  const sheet2 = workbook.addWorksheet("Appium Detailed Results");
  formatWorksheet(sheet2, "Appium Detailed Results", appiumHeaders, appiumRows);

  // Write Workbook
  const destPath = path.join(finalReportsDir, "WellCare_Detailed_Test_Report.xlsx");
  await workbook.xlsx.writeFile(destPath);
  console.log(`Detailed Report created at: ${destPath}`);
  console.log(`Selenium rows added: ${seleniumRows.length}`);
  console.log(`Appium rows added: ${appiumRows.length}`);
}

generateDetailedReport().catch(err => {
  console.error("Failed to generate detailed report:", err);
  process.exit(1);
});

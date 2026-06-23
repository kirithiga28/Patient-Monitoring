/**
 * ExcelReportGenerator.js
 * Well Care Hospital AI Patient Monitoring System
 * Generates selenium-analysis.xlsx with professional formatting
 * Columns: Test ID | Screen Name | Module | Test Case | Expected | Actual | Status | Execution Time
 */

import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import Logger from "./Logger.js";

const OUTPUT_DIR  = path.resolve("selenium/excel-reports");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "selenium-analysis.xlsx");

// Brand palette
const COLORS = {
  headerBg:    "FF1E3A8A",  // Deep Navy
  headerText:  "FFFFFFFF",
  passedBg:    "FFC6EFCE",
  passedText:  "FF006100",
  failedBg:    "FFFFC7CE",
  failedText:  "FF9C0006",
  pendingBg:   "FFFFEB9C",
  pendingText: "FF9C6500",
  rowAlt:      "FFF8FAFF",
  border:      "FFD1D5DB",
  titleBg:     "FF0F172A",
  titleText:   "FF60A5FA",
};

const BORDER = {
  style: "thin",
  color: { argb: COLORS.border },
};

const CELL_BORDER = {
  top: BORDER, bottom: BORDER, left: BORDER, right: BORDER,
};

export default class ExcelReportGenerator {
  constructor() {
    this.rows     = [];
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = "WellCare QA Framework";
    this.workbook.created = new Date();
  }

  /**
   * Add a test result row
   * @param {{ testId, screen, module, testCase, expected, actual, status, time }} row
   */
  addRow(row) {
    this.rows.push(row);
  }

  /**
   * Build and save the Excel workbook
   */
  async save() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // ── Sheet 1: Full Results ──────────────────────────────────────────────────
    const sheet = this.workbook.addWorksheet("Test Results", {
      views: [{ state: "frozen", ySplit: 2 }],
    });

    // Title row
    sheet.mergeCells("A1:H1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Well Care Hospital AI Patient Monitoring — Selenium E2E QA Report";
    titleCell.font        = { bold: true, size: 14, color: { argb: COLORS.titleText } };
    titleCell.fill        = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.titleBg } };
    titleCell.alignment   = { horizontal: "center", vertical: "middle" };
    titleCell.border      = CELL_BORDER;
    sheet.getRow(1).height = 36;

    // Column definitions
    sheet.columns = [
      { header: "Test ID",             key: "testId",   width: 16  },
      { header: "Screen Name",         key: "screen",   width: 28  },
      { header: "Module",              key: "module",   width: 24  },
      { header: "Test Case",           key: "testCase", width: 46  },
      { header: "Expected Result",     key: "expected", width: 44  },
      { header: "Actual Result",       key: "actual",   width: 44  },
      { header: "Status",              key: "status",   width: 14  },
      { header: "Execution Time (ms)", key: "time",     width: 20  },
    ];

    // Header row (row 2, since row 1 is title)
    const headerRow = sheet.getRow(2);
    headerRow.values = [
      "Test ID", "Screen Name", "Module", "Test Case",
      "Expected Result", "Actual Result", "Status", "Execution Time (ms)",
    ];
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.font      = { bold: true, color: { argb: COLORS.headerText }, size: 10 };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border    = CELL_BORDER;
    });

    // Data rows
    this.rows.forEach((r, idx) => {
      const row = sheet.addRow({
        testId:   r.testId   || "",
        screen:   r.screen   || "",
        module:   r.module   || "",
        testCase: r.testCase || "",
        expected: r.expected || "",
        actual:   r.actual   || "",
        status:   r.status   || "",
        time:     r.time     || 0,
      });
      row.height = 20;
      const isAlt = idx % 2 === 1;

      row.eachCell((cell, colNum) => {
        cell.border    = CELL_BORDER;
        cell.font      = { size: 9 };
        cell.alignment = colNum === 1 || colNum === 7
          ? { horizontal: "center", vertical: "middle" }
          : colNum === 8
            ? { horizontal: "right", vertical: "middle" }
            : { horizontal: "left", vertical: "middle", wrapText: true };

        if (isAlt && colNum !== 7) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.rowAlt } };
        }

        if (colNum === 7) {
          const v = String(cell.value).toUpperCase();
          if (v === "PASSED") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.passedBg } };
            cell.font = { color: { argb: COLORS.passedText }, bold: true, size: 9 };
          } else if (v === "FAILED") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.failedBg } };
            cell.font = { color: { argb: COLORS.failedText }, bold: true, size: 9 };
          } else {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.pendingBg } };
            cell.font = { color: { argb: COLORS.pendingText }, bold: true, size: 9 };
          }
        }
      });
    });

    // Auto-filter
    sheet.autoFilter = { from: "A2", to: "H2" };

    // ── Sheet 2: Summary Dashboard ────────────────────────────────────────────
    const summarySheet = this.workbook.addWorksheet("Summary Dashboard");
    this._buildSummarySheet(summarySheet);

    await this.workbook.xlsx.writeFile(OUTPUT_FILE);
    Logger.info(`[ExcelReport] Saved: ${OUTPUT_FILE}`);
    return OUTPUT_FILE;
  }

  _buildSummarySheet(sheet) {
    const total   = this.rows.length;
    const passed  = this.rows.filter(r => String(r.status).toUpperCase() === "PASSED").length;
    const failed  = this.rows.filter(r => String(r.status).toUpperCase() === "FAILED").length;
    const rate    = total > 0 ? ((passed / total) * 100).toFixed(2) : "0.00";
    const elapsed = this.rows.reduce((a, r) => a + (Number(r.time) || 0), 0);

    const header = (row, text) => {
      sheet.mergeCells(`A${row}:B${row}`);
      const c = sheet.getCell(`A${row}`);
      c.value     = text;
      c.font      = { bold: true, size: 12, color: { argb: COLORS.headerText } };
      c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
      c.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(row).height = 28;
    };

    const dataRow = (row, label, value, color = null) => {
      const lCell = sheet.getCell(`A${row}`);
      const vCell = sheet.getCell(`B${row}`);
      lCell.value     = label;
      lCell.font      = { bold: true, size: 10 };
      lCell.border    = CELL_BORDER;
      lCell.alignment = { horizontal: "left", vertical: "middle" };
      vCell.value     = value;
      vCell.font      = color ? { bold: true, size: 11, color: { argb: color } } : { size: 10 };
      vCell.border    = CELL_BORDER;
      vCell.alignment = { horizontal: "center", vertical: "middle" };
    };

    header(1, "Well Care Hospital — Selenium QA Summary");
    dataRow(2, "Total Tests Executed",  total);
    dataRow(3, "Passed",                passed, COLORS.passedText);
    dataRow(4, "Failed",                failed, COLORS.failedText);
    dataRow(5, "Pass Rate",             `${rate}%`, COLORS.passedText);
    dataRow(6, "Total Execution Time",  `${(elapsed / 1000).toFixed(2)} sec`);
    dataRow(7, "Generated At",          new Date().toLocaleString());

    sheet.getColumn("A").width = 30;
    sheet.getColumn("B").width = 20;

    // Module breakdown
    const modules = {};
    this.rows.forEach(r => {
      if (!modules[r.module]) modules[r.module] = { passed: 0, failed: 0 };
      String(r.status).toUpperCase() === "PASSED"
        ? modules[r.module].passed++
        : modules[r.module].failed++;
    });

    header(9, "Module Breakdown");
    const mHeader = sheet.getRow(10);
    mHeader.values = ["Module", "Passed", "Failed", "Total"];
    mHeader.height = 22;
    mHeader.eachCell(c => {
      c.font      = { bold: true, size: 9, color: { argb: COLORS.headerText } };
      c.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
      c.alignment = { horizontal: "center" };
      c.border    = CELL_BORDER;
    });

    let mRow = 11;
    Object.entries(modules).forEach(([mod, counts]) => {
      const row = sheet.getRow(mRow++);
      row.values = [mod, counts.passed, counts.failed, counts.passed + counts.failed];
      row.eachCell(c => { c.border = CELL_BORDER; c.alignment = { horizontal: "center" }; });
    });
  }
}

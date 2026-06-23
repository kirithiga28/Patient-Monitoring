/**
 * Dashboard.js — Final Consolidated QA Dashboard
 * Well Care Hospital AI Patient Monitoring System
 * Generates combined summary: Selenium + Appium results with full metrics
 */

import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

const REPORTS_DIR       = path.resolve("reports");
const SELENIUM_JSON     = path.resolve("selenium/reports/results.json");
const APPIUM_JSON       = path.resolve("appium/reports/results.json");
const DASHBOARD_HTML    = path.join(REPORTS_DIR, "dashboard.html");
const DASHBOARD_EXCEL   = path.resolve("excel-reports/selenium-analysis.xlsx");

[REPORTS_DIR, path.resolve("excel-reports")].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── Load results ──────────────────────────────────────────────────────────────
function loadResults(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[Dashboard] ${label} results not found: ${filePath}`);
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return data.results || [];
  } catch (e) {
    console.error(`[Dashboard] Failed to parse ${label}: ${e.message}`);
    return [];
  }
}

function calcMetrics(results) {
  const total   = results.length;
  const passed  = results.filter(r => String(r.status).toUpperCase() === "PASSED").length;
  const failed  = total - passed;
  const rate    = total > 0 ? ((passed / total) * 100).toFixed(2) : "0.00";
  const elapsed = results.reduce((a, r) => a + (Number(r.duration || r.time) || 0), 0);
  return { total, passed, failed, rate, elapsed };
}

// ─── Main Dashboard Generator ────────────────────────────────────────────────
async function generateDashboard() {
  const seleniumResults = loadResults(SELENIUM_JSON, "Selenium");
  const appiumResults   = loadResults(APPIUM_JSON,   "Appium");
  const allResults      = [...seleniumResults, ...appiumResults];

  const sel  = calcMetrics(seleniumResults);
  const app  = calcMetrics(appiumResults);
  const all  = calcMetrics(allResults);
  const genTime = new Date().toLocaleString();

  console.log("\n" + "═".repeat(70));
  console.log("   WELL CARE HOSPITAL AI — QA CONSOLIDATED DASHBOARD");
  console.log("═".repeat(70));
  console.log(`\n  📊 SELENIUM WEB TESTS`);
  console.log(`     Total   : ${sel.total}`);
  console.log(`     Passed  : ${sel.passed}`);
  console.log(`     Failed  : ${sel.failed}`);
  console.log(`     Pass %  : ${sel.rate}%`);
  console.log(`     Time    : ${(sel.elapsed/1000).toFixed(2)}s`);
  console.log(`\n  📱 APPIUM MOBILE TESTS`);
  console.log(`     Total   : ${app.total}`);
  console.log(`     Passed  : ${app.passed}`);
  console.log(`     Failed  : ${app.failed}`);
  console.log(`     Pass %  : ${app.rate}%`);
  console.log(`     Time    : ${(app.elapsed/1000).toFixed(2)}s`);
  console.log(`\n  🎯 COMBINED TOTALS`);
  console.log(`     Total   : ${all.total}`);
  console.log(`     Passed  : ${all.passed}`);
  console.log(`     Failed  : ${all.failed}`);
  console.log(`     Pass %  : ${all.rate}%`);
  console.log(`     Time    : ${(all.elapsed/1000).toFixed(2)}s`);
  console.log("\n" + "═".repeat(70) + "\n");

  // ── Generate Dashboard HTML ───────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Well Care Hospital AI — QA Consolidated Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0a0f1e;--bg2:#0f172a;--card:#1e293b;--border:#1e3a5f;--text:#e2e8f0;--muted:#64748b;--primary:#3b82f6;--success:#10b981;--danger:#ef4444;--warning:#f59e0b;--purple:#8b5cf6}
    body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;padding:2.5rem;min-height:100vh}
    .container{max-width:1400px;margin:0 auto}

    /* Hero */
    .hero{
      background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#1e3a5f 100%);
      border:1px solid var(--border);border-radius:1.5rem;padding:3rem;
      margin-bottom:2rem;text-align:center;
      box-shadow:0 30px 80px rgba(0,0,0,.5);
      position:relative;overflow:hidden;
    }
    .hero::before{
      content:'';position:absolute;inset:0;
      background:radial-gradient(ellipse at 20% 50%,rgba(59,130,246,.08) 0%,transparent 60%),
                 radial-gradient(ellipse at 80% 50%,rgba(139,92,246,.08) 0%,transparent 60%);
    }
    .hero h1{
      font-size:2.5rem;font-weight:900;letter-spacing:-.03em;position:relative;
      background:linear-gradient(135deg,#60a5fa,#a78bfa,#34d399);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    }
    .hero p{color:var(--muted);font-size:1rem;margin-top:.75rem;position:relative}
    .hero .badge{
      display:inline-block;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);
      color:#a78bfa;padding:.4rem 1.25rem;border-radius:2rem;font-size:.75rem;font-weight:700;
      letter-spacing:.1em;margin-top:1rem;position:relative;
    }

    /* Section header */
    .section-title{font-size:1rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:2rem 0 1rem}

    /* Stats grid */
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.25rem;margin-bottom:2rem}
    .stat-card{
      background:var(--card);border:1px solid var(--border);border-radius:1.125rem;padding:1.75rem;
      transition:transform .25s,box-shadow .25s;cursor:default;
    }
    .stat-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.35)}
    .stat-icon{font-size:1.75rem;margin-bottom:.75rem;display:block}
    .stat-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:.4rem}
    .stat-value{font-size:2.5rem;font-weight:900;line-height:1}
    .stat-value.blue{color:var(--primary)}.stat-value.green{color:var(--success)}
    .stat-value.red{color:var(--danger)}.stat-value.yellow{color:var(--warning)}.stat-value.purple{color:var(--purple)}
    .stat-sub{font-size:.75rem;color:var(--muted);margin-top:.3rem}

    /* Comparison cards */
    .compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem}
    .compare-card{background:var(--card);border:1px solid var(--border);border-radius:1.125rem;padding:1.75rem}
    .compare-card h3{font-size:1.1rem;font-weight:800;margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem}
    .compare-row{display:flex;justify-content:space-between;align-items:center;padding:.6rem 0;border-bottom:1px solid rgba(30,58,95,.4)}
    .compare-row:last-child{border-bottom:none}
    .compare-label{color:var(--muted);font-size:.85rem}
    .compare-val{font-weight:700;font-size:.95rem}
    .compare-val.green{color:var(--success)}.compare-val.red{color:var(--danger)}.compare-val.blue{color:var(--primary)}

    /* Progress bars */
    .progress-wrap{margin:1rem 0}
    .progress-label{display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.4rem}
    .progress-bar{height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}
    .progress-fill{height:100%;border-radius:4px;transition:width 1s ease}
    .progress-fill.green{background:linear-gradient(90deg,#10b981,#34d399)}
    .progress-fill.red{background:linear-gradient(90deg,#ef4444,#f87171)}

    /* Charts */
    .charts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;margin-bottom:2rem}
    .chart-card{background:var(--card);border:1px solid var(--border);border-radius:1.125rem;padding:1.75rem}
    .chart-card h3{font-size:.85rem;font-weight:700;color:var(--muted);margin-bottom:1.25rem;text-transform:uppercase;letter-spacing:.05em}
    .chart-wrap{position:relative;height:240px}

    /* Links */
    .report-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:2rem}
    .report-link{
      background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1.25rem;
      text-decoration:none;color:var(--text);transition:all .2s;display:flex;align-items:center;gap:.75rem;
    }
    .report-link:hover{border-color:var(--primary);background:rgba(59,130,246,.06)}
    .report-link-icon{font-size:1.5rem}
    .report-link-title{font-weight:700;font-size:.9rem}
    .report-link-sub{color:var(--muted);font-size:.75rem;margin-top:.2rem}

    .footer{text-align:center;margin-top:2rem;color:var(--muted);font-size:.75rem;padding-top:1.5rem;border-top:1px solid var(--border)}

    @media(max-width:800px){.compare-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
<div class="container">

  <!-- Hero -->
  <div class="hero">
    <h1>🏥 Well Care Hospital AI</h1>
    <p>Patient Monitoring System — QA Consolidated Dashboard</p>
    <div class="badge">640 TOTAL TEST CASES | 32 SCREENS | SELENIUM + APPIUM</div>
  </div>

  <!-- Combined Summary -->
  <div class="section-title">📊 Combined Summary</div>
  <div class="stats-grid">
    <div class="stat-card"><span class="stat-icon">🧪</span><div class="stat-label">Total Tests</div><div class="stat-value blue">${all.total}</div><div class="stat-sub">Selenium + Appium</div></div>
    <div class="stat-card"><span class="stat-icon">✅</span><div class="stat-label">Passed</div><div class="stat-value green">${all.passed}</div><div class="stat-sub">Successful cases</div></div>
    <div class="stat-card"><span class="stat-icon">❌</span><div class="stat-label">Failed</div><div class="stat-value red">${all.failed}</div><div class="stat-sub">Need attention</div></div>
    <div class="stat-card"><span class="stat-icon">📈</span><div class="stat-label">Pass Rate</div><div class="stat-value green">${all.rate}%</div><div class="stat-sub">Overall compliance</div></div>
    <div class="stat-card"><span class="stat-icon">⏱️</span><div class="stat-label">Total Exec Time</div><div class="stat-value purple">${(all.elapsed/1000).toFixed(1)}s</div><div class="stat-sub">Combined duration</div></div>
    <div class="stat-card"><span class="stat-icon">🖥️</span><div class="stat-label">Screens Covered</div><div class="stat-value yellow">32</div><div class="stat-sub">Full coverage</div></div>
  </div>

  <!-- Comparison -->
  <div class="section-title">⚡ Framework Comparison</div>
  <div class="compare-grid">
    <div class="compare-card">
      <h3>🌐 Selenium Web Tests</h3>
      <div class="compare-row"><span class="compare-label">Total Tests</span><span class="compare-val blue">${sel.total}</span></div>
      <div class="compare-row"><span class="compare-label">Passed</span><span class="compare-val green">${sel.passed}</span></div>
      <div class="compare-row"><span class="compare-label">Failed</span><span class="compare-val red">${sel.failed}</span></div>
      <div class="compare-row"><span class="compare-label">Pass Rate</span><span class="compare-val green">${sel.rate}%</span></div>
      <div class="compare-row"><span class="compare-label">Execution Time</span><span class="compare-val blue">${(sel.elapsed/1000).toFixed(2)}s</span></div>
      <div class="progress-wrap">
        <div class="progress-label"><span>Pass Rate</span><span>${sel.rate}%</span></div>
        <div class="progress-bar"><div class="progress-fill green" style="width:${sel.rate}%"></div></div>
      </div>
    </div>
    <div class="compare-card">
      <h3>📱 Appium Mobile Tests</h3>
      <div class="compare-row"><span class="compare-label">Total Tests</span><span class="compare-val blue">${app.total}</span></div>
      <div class="compare-row"><span class="compare-label">Passed</span><span class="compare-val green">${app.passed}</span></div>
      <div class="compare-row"><span class="compare-label">Failed</span><span class="compare-val red">${app.failed}</span></div>
      <div class="compare-row"><span class="compare-label">Pass Rate</span><span class="compare-val green">${app.rate}%</span></div>
      <div class="compare-row"><span class="compare-label">Execution Time</span><span class="compare-val blue">${(app.elapsed/1000).toFixed(2)}s</span></div>
      <div class="progress-wrap">
        <div class="progress-label"><span>Pass Rate</span><span>${app.rate}%</span></div>
        <div class="progress-bar"><div class="progress-fill green" style="width:${app.rate}%"></div></div>
      </div>
    </div>
  </div>

  <!-- Charts -->
  <div class="section-title">📉 Analytics</div>
  <div class="charts-grid">
    <div class="chart-card">
      <h3>Overall Pass/Fail Distribution</h3>
      <div class="chart-wrap"><canvas id="combinedDonut"></canvas></div>
    </div>
    <div class="chart-card">
      <h3>Selenium vs Appium Comparison</h3>
      <div class="chart-wrap"><canvas id="compareBar"></canvas></div>
    </div>
    <div class="chart-card">
      <h3>Test Execution Timeline</h3>
      <div class="chart-wrap"><canvas id="timeChart"></canvas></div>
    </div>
  </div>

  <!-- Report Links -->
  <div class="section-title">📋 Generated Reports</div>
  <div class="report-links">
    <a class="report-link" href="../selenium/reports/selenium-report.html" target="_blank">
      <span class="report-link-icon">🌐</span>
      <div><div class="report-link-title">Selenium HTML Report</div><div class="report-link-sub">320 Web Test Cases</div></div>
    </a>
    <a class="report-link" href="../appium/reports/appium-report.html" target="_blank">
      <span class="report-link-icon">📱</span>
      <div><div class="report-link-title">Appium HTML Report</div><div class="report-link-sub">320 Mobile Test Cases</div></div>
    </a>
    <a class="report-link" href="../selenium/reports/results.json" target="_blank">
      <span class="report-link-icon">📄</span>
      <div><div class="report-link-title">Selenium JSON Data</div><div class="report-link-sub">Raw results.json</div></div>
    </a>
    <a class="report-link" href="../appium/reports/results.json" target="_blank">
      <span class="report-link-icon">📄</span>
      <div><div class="report-link-title">Appium JSON Data</div><div class="report-link-sub">Raw results.json</div></div>
    </a>
    <a class="report-link" href="../excel-reports/selenium-analysis.xlsx" target="_blank">
      <span class="report-link-icon">📊</span>
      <div><div class="report-link-title">Excel QA Analysis</div><div class="report-link-sub">selenium-analysis.xlsx</div></div>
    </a>
    <a class="report-link" href="../selenium/logs/selenium-execution.log" target="_blank">
      <span class="report-link-icon">📝</span>
      <div><div class="report-link-title">Execution Logs</div><div class="report-link-sub">selenium-execution.log</div></div>
    </a>
  </div>

  <div class="footer">
    Well Care Hospital AI Patient Monitoring System — QA Automation Framework v2.0<br>
    Generated: ${genTime} | Selenium WebDriver + Appium | 640 Total Test Cases
  </div>
</div>

<script>
  // Combined donut
  new Chart(document.getElementById('combinedDonut'), {
    type: 'doughnut',
    data: {
      labels: ['Passed', 'Failed'],
      datasets: [{ data: [${all.passed}, ${all.failed}], backgroundColor: ['#10b981','#ef4444'], borderWidth: 3, borderColor: '#1e293b' }]
    },
    options: { responsive:true, maintainAspectRatio:false, cutout:'70%', plugins:{legend:{labels:{color:'#94a3b8',font:{size:12}}}} }
  });

  // Comparison bar
  new Chart(document.getElementById('compareBar'), {
    type: 'bar',
    data: {
      labels: ['Selenium Web', 'Appium Mobile'],
      datasets: [
        { label:'Passed', data:[${sel.passed},${app.passed}], backgroundColor:['rgba(16,185,129,.8)','rgba(16,185,129,.6)'], borderRadius:6 },
        { label:'Failed', data:[${sel.failed},${app.failed}], backgroundColor:['rgba(239,68,68,.8)','rgba(239,68,68,.6)'],  borderRadius:6 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#94a3b8'}}},
      scales:{
        x:{ticks:{color:'#64748b'},grid:{color:'#1e3a5f'}},
        y:{ticks:{color:'#64748b'},grid:{color:'#1e3a5f'}}
      }
    }
  });

  // Time chart
  new Chart(document.getElementById('timeChart'), {
    type: 'bar',
    data: {
      labels: ['Selenium', 'Appium', 'Total'],
      datasets:[{
        label:'Execution Time (s)',
        data:[${(sel.elapsed/1000).toFixed(1)}, ${(app.elapsed/1000).toFixed(1)}, ${(all.elapsed/1000).toFixed(1)}],
        backgroundColor:['rgba(59,130,246,.7)','rgba(139,92,246,.7)','rgba(245,158,11,.7)'],
        borderRadius:6
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#94a3b8'}}},
      scales:{
        x:{ticks:{color:'#64748b'},grid:{color:'#1e3a5f'}},
        y:{ticks:{color:'#64748b'},grid:{color:'#1e3a5f'}}
      }
    }
  });
</script>
</body></html>`;

  fs.writeFileSync(DASHBOARD_HTML, html, "utf8");
  console.log(`[Dashboard] HTML Dashboard → ${DASHBOARD_HTML}`);

  // ── Consolidated Excel ────────────────────────────────────────────────────
  const workbook  = new ExcelJS.Workbook();
  workbook.creator = "WellCare QA Framework";
  workbook.created = new Date();

  const BORDER   = { style:"thin", color:{argb:"FFD1D5DB"} };
  const CBORDER  = { top:BORDER, bottom:BORDER, left:BORDER, right:BORDER };

  // Summary sheet
  const summary  = workbook.addWorksheet("QA Summary Dashboard");
  summary.columns = [{ key:"label", width:35 }, { key:"web", width:18 }, { key:"mobile", width:18 }, { key:"total", width:18 }];

  const addHeader = (sheet, row, text, cols = 4) => {
    sheet.mergeCells(`A${row}:D${row}`);
    const c = sheet.getCell(`A${row}`);
    c.value = text; c.font = { bold:true, size:12, color:{argb:"FFFFFFFF"} };
    c.fill  = { type:"pattern", pattern:"solid", fgColor:{argb:"FF1E3A8A"} };
    c.alignment = { horizontal:"center", vertical:"middle" };
    c.border = CBORDER;
    sheet.getRow(row).height = 28;
  };

  const addRow = (sheet, row, label, web, mobile, total, webClr=null, mobClr=null, totClr=null) => {
    const r = sheet.getRow(row);
    r.values = [label, web, mobile, total];
    r.height = 22;
    r.eachCell((c, col) => {
      c.border    = CBORDER;
      c.alignment = col === 1 ? { horizontal:"left", vertical:"middle" } : { horizontal:"center", vertical:"middle" };
      c.font      = { size:10 };
      if (col === 2 && webClr)  c.font = { bold:true, size:10, color:{argb:webClr} };
      if (col === 3 && mobClr)  c.font = { bold:true, size:10, color:{argb:mobClr} };
      if (col === 4 && totClr)  c.font = { bold:true, size:10, color:{argb:totClr} };
    });
  };

  addHeader(summary, 1, "Well Care Hospital AI — QA Consolidated Dashboard");
  const hRow = summary.getRow(2);
  hRow.values = ["Metric", "Selenium Web", "Appium Mobile", "Combined Total"];
  hRow.height = 24;
  hRow.eachCell(c => {
    c.font = { bold:true, size:10, color:{argb:"FFFFFFFF"} };
    c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF1E3A8A"} };
    c.alignment = { horizontal:"center", vertical:"middle" };
    c.border = CBORDER;
  });

  addRow(summary, 3,  "Total Test Cases",        sel.total,                   app.total,                   all.total,                   null,         null,         null);
  addRow(summary, 4,  "Passed",                   sel.passed,                  app.passed,                  all.passed,                  "FF006100",   "FF006100",   "FF006100");
  addRow(summary, 5,  "Failed",                   sel.failed,                  app.failed,                  all.failed,                  "FF9C0006",   "FF9C0006",   "FF9C0006");
  addRow(summary, 6,  "Pass Rate",                `${sel.rate}%`,              `${app.rate}%`,              `${all.rate}%`,              "FF006100",   "FF006100",   "FF006100");
  addRow(summary, 7,  "Total Execution Time",     `${(sel.elapsed/1000).toFixed(2)}s`, `${(app.elapsed/1000).toFixed(2)}s`, `${(all.elapsed/1000).toFixed(2)}s`, null, null, null);
  addRow(summary, 8,  "Screens Covered",          32,                          32,                          32,                          null,         null,         null);
  addRow(summary, 9,  "TCs per Screen",           10,                          10,                          10,                          null,         null,         null);
  addRow(summary, 10, "Generated At",             genTime,                     genTime,                     genTime,                     null,         null,         null);

  // Full results sheets
  const addResultsSheet = (name, rows) => {
    const sheet = workbook.addWorksheet(name, { views:[{ state:"frozen", ySplit:2 }] });
    sheet.mergeCells("A1:H1");
    const t = sheet.getCell("A1");
    t.value = `Well Care Hospital AI — ${name}`;
    t.font = { bold:true, size:13, color:{argb:"FF60A5FA"} };
    t.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F172A"} };
    t.alignment = { horizontal:"center", vertical:"middle" };
    t.border = CBORDER;
    sheet.getRow(1).height = 34;

    sheet.columns = [
      { header:"Test ID",       key:"id",       width:16 },
      { header:"Screen Name",   key:"screen",   width:28 },
      { header:"Module",        key:"module",   width:24 },
      { header:"Test Case",     key:"name",     width:40 },
      { header:"Expected",      key:"expected", width:40 },
      { header:"Actual",        key:"actual",   width:40 },
      { header:"Status",        key:"status",   width:14 },
      { header:"Time (ms)",     key:"time",     width:14 },
    ];

    const hRow2 = sheet.getRow(2);
    hRow2.values = ["Test ID","Screen Name","Module","Test Case","Expected","Actual","Status","Time (ms)"];
    hRow2.height = 26;
    hRow2.eachCell(c => {
      c.font = { bold:true, color:{argb:"FFFFFFFF"}, size:9 };
      c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF1E3A8A"} };
      c.alignment = { horizontal:"center", vertical:"middle", wrapText:true };
      c.border = CBORDER;
    });
    sheet.autoFilter = { from:"A2", to:"H2" };

    rows.forEach((r, i) => {
      const row = sheet.addRow({
        id:       r.id || r.testId || "",
        screen:   r.screenName || r.screen || "",
        module:   r.module || "",
        name:     r.testName || r.testCase || r.name || "",
        expected: r.expected || "",
        actual:   r.actual || "",
        status:   r.status || "",
        time:     r.duration || r.time || 0,
      });
      row.height = 18;
      row.eachCell((c, col) => {
        c.border = CBORDER;
        c.font   = { size:8.5 };
        c.alignment = (col===1||col===7) ? { horizontal:"center", vertical:"middle" }
          : col===8 ? { horizontal:"right", vertical:"middle" }
          : { horizontal:"left", vertical:"middle", wrapText:true };
        if (i%2===1 && col!==7) c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFF8FAFF"} };
        if (col===7) {
          const v = String(c.value).toUpperCase();
          c.fill = { type:"pattern", pattern:"solid", fgColor:{argb: v==="PASSED"?"FFC6EFCE":"FFFFC7CE"} };
          c.font = { bold:true, size:8.5, color:{argb: v==="PASSED"?"FF006100":"FF9C0006"} };
        }
      });
    });
  };

  addResultsSheet("Selenium Results",      seleniumResults);
  addResultsSheet("Appium Results",        appiumResults);
  addResultsSheet("Combined Results",      allResults);

  await workbook.xlsx.writeFile(DASHBOARD_EXCEL);
  console.log(`[Dashboard] Excel → ${DASHBOARD_EXCEL}`);
}

generateDashboard().catch(err => {
  console.error("[Dashboard] Error:", err.message);
  process.exit(1);
});

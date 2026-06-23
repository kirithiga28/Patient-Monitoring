/**
 * reporter.js — Well Care Hospital AI Patient Monitoring System
 * Consolidated report generator — reads Selenium + Appium JSON, generates unified HTML + Excel
 */

import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { fileURLToPath } from "url";

export async function generateReports(results, testSuiteName = "Well Care Hospital Test Suite", fileSuffix = "") {
  const reportsDir = path.resolve("reports");
  const excelDir   = path.resolve("excel-reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  if (!fs.existsSync(excelDir))   fs.mkdirSync(excelDir,   { recursive: true });

  const total        = results.length;
  const passed       = results.filter(r => r.status === "PASSED").length;
  const failed       = results.filter(r => r.status === "FAILED").length;
  const pending      = results.filter(r => r.status === "PENDING").length;
  const passRate     = total > 0 ? ((passed / total) * 100).toFixed(2) : "0.00";
  const totalDuration= results.reduce((acc, r) => acc + (r.duration || 0), 0);
  const suffix       = fileSuffix ? `-${fileSuffix}` : "";

  // ── JSON ───────────────────────────────────────────────────────────────────
  const jsonPath = path.join(reportsDir, suffix ? `results${suffix}.json` : "results.json");
  fs.writeFileSync(jsonPath, JSON.stringify({
    suiteName: testSuiteName,
    timestamp: new Date().toISOString(),
    metrics: { total, passed, failed, pending, passRate: `${passRate}%`, executionTimeMs: totalDuration },
    results
  }, null, 2), "utf8");
  console.log(`[Reporter] JSON → ${jsonPath}`);

  // ── Excel ──────────────────────────────────────────────────────────────────
  const workbook  = new ExcelJS.Workbook();
  workbook.creator= "WellCare QA Framework";
  const worksheet = workbook.addWorksheet("QA E2E Analysis", { views:[{ state:"frozen", ySplit:2 }] });
  const BORDER    = { style:"thin", color:{argb:"FFD9D9D9"} };
  const CB        = { top:BORDER, bottom:BORDER, left:BORDER, right:BORDER };

  worksheet.mergeCells("A1:H1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = testSuiteName;
  titleCell.font  = { bold:true, size:13, color:{argb:"FF60A5FA"} };
  titleCell.fill  = { type:"pattern", pattern:"solid", fgColor:{argb:"FF0F172A"} };
  titleCell.alignment = { horizontal:"center", vertical:"middle" };
  titleCell.border= CB;
  worksheet.getRow(1).height = 34;

  worksheet.columns = [
    { header:"Test ID",             key:"id",         width:14 },
    { header:"Module",              key:"module",     width:24 },
    { header:"Screen Name",         key:"screenName", width:28 },
    { header:"Test Case",           key:"name",       width:46 },
    { header:"Expected Result",     key:"expected",   width:46 },
    { header:"Actual Result",       key:"actual",     width:46 },
    { header:"Status",              key:"status",     width:14 },
    { header:"Execution Time (ms)", key:"duration",   width:22 },
  ];

  const hRow = worksheet.getRow(2);
  hRow.values = ["Test ID","Module","Screen Name","Test Case","Expected Result","Actual Result","Status","Execution Time (ms)"];
  hRow.height = 28;
  hRow.eachCell(c => {
    c.font = { bold:true, color:{argb:"FFFFFFFF"}, size:10 };
    c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FF1E3A8A"} };
    c.alignment = { vertical:"middle", horizontal:"center", wrapText:true };
    c.border = CB;
  });
  worksheet.autoFilter = { from:"A2", to:"H2" };

  results.forEach((item, idx) => {
    const row = worksheet.addRow({
      id:         item.id,
      module:     item.module      || "General",
      screenName: item.screenName  || "General Screen",
      name:       item.name,
      expected:   item.expected    || "UI behaves correctly and meets QA specs.",
      actual:     item.actual      || "Verified successfully.",
      status:     item.status,
      duration:   item.duration    || 0
    });
    row.height = 20;
    row.eachCell((c, col) => {
      c.border    = CB;
      c.font      = { size:9 };
      c.alignment = (col===1||col===7) ? { horizontal:"center", vertical:"middle" }
        : col===8 ? { horizontal:"right", vertical:"middle" }
        : { horizontal:"left", vertical:"middle", wrapText:true };
      if (idx%2===1 && col!==7) c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFF8FAFF"} };
      if (col===7) {
        const v = String(c.value).toUpperCase();
        c.fill = { type:"pattern", pattern:"solid", fgColor:{argb: v==="PASSED"?"FFC6EFCE":v==="FAILED"?"FFFFC7CE":"FFFFEB9C"} };
        c.font = { color:{argb: v==="PASSED"?"FF006100":v==="FAILED"?"FF9C0006":"FF9C6500"}, bold:true, size:9 };
      }
    });
  });

  const excelPath = path.join(excelDir, suffix ? `selenium-analysis${suffix}.xlsx` : "selenium-analysis.xlsx");
  await workbook.xlsx.writeFile(excelPath);
  console.log(`[Reporter] Excel → ${excelPath}`);

  // ── HTML ───────────────────────────────────────────────────────────────────
  const htmlPath = path.join(reportsDir, suffix ? `selenium-report${suffix}.html` : "selenium-report.html");
  const rows = results.map(r => `
    <tr data-status="${r.status.toLowerCase()}">
      <td style="font-family:monospace;font-weight:700;color:var(--text-muted)">${r.id}</td>
      <td style="font-weight:600;color:var(--primary)">${r.module||"General"}</td>
      <td style="font-weight:600">${r.screenName||"General Screen"}</td>
      <td>${r.name}</td>
      <td style="color:var(--text-muted)">${r.expected||"N/A"}</td>
      <td>${r.actual||"N/A"}</td>
      <td style="font-family:monospace;color:var(--text-muted)">${r.duration||0} ms</td>
      <td><span class="status-badge ${r.status.toLowerCase()}">${r.status}</span></td>
      <td>${r.screenshot?`<a class="screenshot-link" href="../screenshots/${path.basename(r.screenshot)}" target="_blank">📸 View</a>`:"N/A"}</td>
    </tr>`).join("");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${testSuiteName} — E2E QA Report</title>
  <style>
    :root{--bg-dark:#0f172a;--bg-card:#1e293b;--border:#334155;--text-main:#f1f5f9;--text-muted:#94a3b8;--primary:#3b82f6;--primary-hover:#60a5fa;--success:#10b981;--danger:#ef4444;--warning:#f59e0b}
    body{background-color:var(--bg-dark);color:var(--text-main);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;margin:0;padding:2rem}
    .container{max-width:1400px;margin:0 auto}
    .header{background-color:var(--bg-card);border:1px solid var(--border);padding:1.5rem 2rem;border-radius:1rem;margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center}
    .header h1{margin:0;font-size:1.75rem;font-weight:800;background:linear-gradient(135deg,#60a5fa,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .header p{margin:.25rem 0 0;font-size:.85rem;color:var(--text-muted)}
    .badge{background-color:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);color:var(--primary);padding:.5rem 1rem;border-radius:.75rem;font-size:.75rem;font-weight:700;letter-spacing:.05em}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.5rem;margin-bottom:2rem}
    .card{background-color:var(--bg-card);border:1px solid var(--border);border-radius:1rem;padding:1.5rem;display:flex;flex-direction:column}
    .card-title{font-size:.75rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:.05em;margin-bottom:.5rem}
    .card-value{font-size:2rem;font-weight:800;margin:0}
    .card-value.success{color:var(--success)}.card-value.danger{color:var(--danger)}.card-value.warning{color:var(--warning)}
    .toolbar{display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap}
    .toolbar input{flex:1;min-width:200px;background:var(--bg-card);border:1px solid var(--border);color:var(--text-main);padding:.6rem 1rem;border-radius:.6rem;font-size:.85rem;outline:none}
    .toolbar input:focus{border-color:var(--primary)}
    .filter-btn{background:var(--bg-card);border:1px solid var(--border);color:var(--text-muted);padding:.6rem 1.1rem;border-radius:.6rem;cursor:pointer;font-size:.8rem;font-weight:700}
    .filter-btn.active,.filter-btn:hover{background:var(--primary);border-color:var(--primary);color:white}
    .table-container{background-color:var(--bg-card);border:1px solid var(--border);border-radius:1rem;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,.1)}
    table{width:100%;border-collapse:collapse;text-align:left;font-size:.8rem}
    th{background-color:rgba(15,23,42,.4);color:var(--text-muted);font-weight:700;padding:1rem 1.25rem;border-bottom:1px solid var(--border);text-transform:uppercase;font-size:.7rem;letter-spacing:.05em}
    td{padding:1rem 1.25rem;border-bottom:1px solid var(--border);vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tr:hover td{background-color:rgba(255,255,255,.02)}
    .status-badge{display:inline-block;padding:.25rem .5rem;border-radius:.375rem;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
    .status-badge.passed{background-color:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);color:var(--success)}
    .status-badge.failed{background-color:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:var(--danger)}
    .screenshot-link{color:var(--primary);text-decoration:none;font-weight:600}
    .footer{text-align:center;margin-top:2rem;color:var(--text-muted);font-size:.75rem}
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div><h1>🏥 ${testSuiteName}</h1><p>E2E QA Audit | Generated: ${new Date().toLocaleString()}</p></div>
    <div class="badge">QA COMPLIANCE</div>
  </div>
  <div class="grid">
    <div class="card"><span class="card-title">Total Tests</span><span class="card-value">${total}</span></div>
    <div class="card"><span class="card-title">Passed</span><span class="card-value success">${passed}</span></div>
    <div class="card"><span class="card-title">Failed</span><span class="card-value danger">${failed}</span></div>
    <div class="card"><span class="card-title">Pending</span><span class="card-value warning">${pending}</span></div>
    <div class="card"><span class="card-title">Exec Time</span><span class="card-value">${(totalDuration/1000).toFixed(2)}s</span></div>
    <div class="card"><span class="card-title">Pass Rate</span><span class="card-value success">${passRate}%</span></div>
  </div>
  <div class="toolbar">
    <input type="text" id="searchInput" placeholder="🔍 Search tests…" oninput="filterTable()">
    <button class="filter-btn active" id="btn-all"    onclick="setFilter('all')">All (${total})</button>
    <button class="filter-btn"        id="btn-passed" onclick="setFilter('passed')">✅ Passed (${passed})</button>
    <button class="filter-btn"        id="btn-failed" onclick="setFilter('failed')">❌ Failed (${failed})</button>
  </div>
  <div class="table-container">
    <table>
      <thead><tr><th>ID</th><th>Module</th><th>Screen</th><th>Test Case</th><th>Expected</th><th>Actual</th><th>Time</th><th>Status</th><th>Screenshot</th></tr></thead>
      <tbody id="tableBody">${rows}</tbody>
    </table>
  </div>
  <div class="footer">Well Care Hospital AI Patient Monitoring System — QA Automation Framework v2.0 | ${new Date().toLocaleString()}</div>
</div>
<script>
  let f='all';
  function setFilter(v){f=v;['all','passed','failed'].forEach(k=>document.getElementById('btn-'+k).classList.toggle('active',k===v));filterTable();}
  function filterTable(){const q=document.getElementById('searchInput').value.toLowerCase();document.querySelectorAll('#tableBody tr').forEach(r=>{const m=!q||r.textContent.toLowerCase().includes(q);const sf=f==='all'||r.dataset.status===f;r.style.display=m&&sf?'':'none';});}
</script>
</body></html>`;

  fs.writeFileSync(htmlPath, htmlContent, "utf8");
  console.log(`[Reporter] HTML → ${htmlPath}`);
}

// ── Standalone consolidation run ────────────────────────────────────────────────
async function runConsolidation() {
  const reportsDir   = path.resolve("reports");
  const webJsonPath  = path.join(reportsDir, "results-web.json");
  const mobileJsonPath = path.join(reportsDir, "results-mobile.json");

  console.log("\n" + "═".repeat(60));
  console.log("   WELL CARE HOSPITAL — CONSOLIDATED REPORT COMPILER");
  console.log("═".repeat(60) + "\n");

  let consolidated = [];

  for (const [file, label] of [[webJsonPath,"web"], [mobileJsonPath,"mobile"]]) {
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, "utf8"));
        consolidated = consolidated.concat(data.results || []);
        console.log(`[Reporter] Loaded ${(data.results||[]).length} ${label} cases from ${path.basename(file)}`);
      } catch (e) { console.error(`[Reporter] Error parsing ${path.basename(file)}: ${e.message}`); }
    }
  }

  // Also try selenium/reports and appium/reports
  const selJson = path.resolve("selenium/reports/results.json");
  const appJson = path.resolve("appium/reports/results.json");
  for (const [file, label] of [[selJson,"selenium"], [appJson,"appium"]]) {
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, "utf8"));
        if (data.results) {
          consolidated = consolidated.concat(data.results);
          console.log(`[Reporter] Loaded ${data.results.length} ${label} cases from ${path.basename(file)}`);
        }
      } catch (e) { /* skip */ }
    }
  }

  if (consolidated.length > 0) {
    await generateReports(consolidated, "Well Care Hospital AI — Unified QA Suite", "");
    const total    = consolidated.length;
    const passed   = consolidated.filter(r => r.status === "PASSED").length;
    const failed   = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : "0.00";
    const elapsed  = consolidated.reduce((acc, r) => acc + (r.duration || 0), 0);

    console.log("\n" + "═".repeat(60));
    console.log("   CONSOLIDATED PERFORMANCE SUMMARY");
    console.log("═".repeat(60));
    console.log(`  Total Tests Executed  : ${total}`);
    console.log(`  Passed                : ${passed}`);
    console.log(`  Failed                : ${failed}`);
    console.log(`  Pass Rate             : ${passRate}%`);
    console.log(`  Execution Time        : ${(elapsed/1000).toFixed(2)}s`);
    console.log("═".repeat(60) + "\n");
  } else {
    console.log("[Reporter] No result files found. Run test:selenium or test:appium first.");
  }
}

const currentFilePath   = fileURLToPath(import.meta.url);
const executionFilePath = fs.realpathSync(process.argv[1] || "");
if (executionFilePath === currentFilePath) {
  runConsolidation().catch(err => {
    console.error("[Reporter] Consolidation failed:", err.message);
  });
}

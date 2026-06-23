/**
 * HtmlReportGenerator.js
 * Well Care Hospital AI Patient Monitoring System
 * Generates premium dark-mode HTML test report with statistics cards, filterable table, and charts
 */

import fs from "fs";
import path from "path";
import Logger from "./Logger.js";

const OUTPUT_DIR  = path.resolve("selenium/reports");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "selenium-report.html");
const JSON_FILE   = path.join(OUTPUT_DIR, "results.json");

export default class HtmlReportGenerator {
  /**
   * @param {Array<{testId, screen, module, testCase, expected, actual, status, time, screenshot, remarks}>} results
   * @param {string} suiteName
   */
  static generate(results, suiteName = "Well Care Hospital AI Selenium QA Report") {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const total    = results.length;
    const passed   = results.filter(r => String(r.status).toUpperCase() === "PASSED").length;
    const failed   = results.filter(r => String(r.status).toUpperCase() === "FAILED").length;
    const pending  = total - passed - failed;
    const rate     = total > 0 ? ((passed / total) * 100).toFixed(2) : "0.00";
    const elapsed  = results.reduce((a, r) => a + (Number(r.time) || 0), 0);
    const genTime  = new Date().toLocaleString();

    // Module breakdown for chart
    const moduleMap = {};
    results.forEach(r => {
      const m = r.module || "General";
      if (!moduleMap[m]) moduleMap[m] = { passed: 0, failed: 0 };
      String(r.status).toUpperCase() === "PASSED" ? moduleMap[m].passed++ : moduleMap[m].failed++;
    });
    const moduleLabels = JSON.stringify(Object.keys(moduleMap));
    const modulePassed = JSON.stringify(Object.values(moduleMap).map(v => v.passed));
    const moduleFailed = JSON.stringify(Object.values(moduleMap).map(v => v.failed));

    // Save JSON report
    const jsonData = {
      suiteName,
      generatedAt: new Date().toISOString(),
      summary: { total, passed, failed, pending, passRate: `${rate}%`, executionTimeMs: elapsed },
      results,
    };
    fs.writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2), "utf8");
    Logger.info(`[HtmlReport] JSON saved: ${JSON_FILE}`);

    const rows = results.map((r, i) => {
      const statusClass = String(r.status).toLowerCase() === "passed" ? "passed" : "failed";
      const ssLink = r.screenshot
        ? `<a class="ss-link" href="../screenshots/${path.basename(r.screenshot)}" target="_blank">📸 View</a>`
        : "–";
      const rowClass = i % 2 === 0 ? "" : ' class="alt"';
      return `
        <tr${rowClass} data-status="${statusClass}" data-module="${r.module || ''}">
          <td class="mono">${r.testId || ""}</td>
          <td class="screen">${r.screen || ""}</td>
          <td>${r.module || ""}</td>
          <td>${r.testCase || ""}</td>
          <td class="muted">${r.expected || ""}</td>
          <td>${r.actual || ""}</td>
          <td><span class="badge ${statusClass}">${String(r.status || "").toUpperCase()}</span></td>
          <td class="mono right">${r.time || 0} ms</td>
          <td>${ssLink}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${suiteName}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:        #0a0f1e;
      --bg2:       #0f172a;
      --card:      #1e293b;
      --border:    #1e3a5f;
      --text:      #e2e8f0;
      --muted:     #64748b;
      --primary:   #3b82f6;
      --success:   #10b981;
      --danger:    #ef4444;
      --warning:   #f59e0b;
      --font:      'Segoe UI', system-ui, sans-serif;
    }
    body { background: var(--bg); color: var(--text); font-family: var(--font); padding: 2rem; min-height: 100vh; }
    .container { max-width: 1440px; margin: 0 auto; }

    /* Header */
    .header {
      display: flex; align-items: center; justify-content: space-between;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      border: 1px solid var(--border); border-radius: 1.25rem;
      padding: 1.75rem 2.5rem; margin-bottom: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .header-left h1 {
      font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em;
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .header-left p { color: var(--muted); font-size: 0.85rem; margin-top: 0.3rem; }
    .badge-qa {
      background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3);
      color: var(--primary); padding: 0.5rem 1.25rem; border-radius: 0.75rem;
      font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em;
    }

    /* Stats grid */
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .stat-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 1rem;
      padding: 1.5rem; transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
    .stat-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 0.5rem; }
    .stat-value { font-size: 2.25rem; font-weight: 900; line-height: 1; }
    .stat-value.blue   { color: var(--primary); }
    .stat-value.green  { color: var(--success); }
    .stat-value.red    { color: var(--danger); }
    .stat-value.yellow { color: var(--warning); }

    /* Charts */
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .chart-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 1rem;
      padding: 1.5rem;
    }
    .chart-card h3 { font-size: 0.85rem; font-weight: 700; color: var(--muted); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .chart-wrap { position: relative; height: 220px; }
    @media (max-width: 900px) { .charts { grid-template-columns: 1fr; } }

    /* Toolbar */
    .toolbar {
      display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;
    }
    .toolbar input {
      flex: 1; min-width: 200px; background: var(--card); border: 1px solid var(--border);
      color: var(--text); padding: 0.6rem 1rem; border-radius: 0.6rem; font-size: 0.85rem;
      outline: none;
    }
    .toolbar input:focus { border-color: var(--primary); }
    .filter-btn {
      background: var(--card); border: 1px solid var(--border); color: var(--muted);
      padding: 0.6rem 1.2rem; border-radius: 0.6rem; cursor: pointer; font-size: 0.8rem;
      font-weight: 700; transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active { background: var(--primary); border-color: var(--primary); color: white; }

    /* Table */
    .table-wrap {
      background: var(--card); border: 1px solid var(--border); border-radius: 1rem;
      overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    thead { position: sticky; top: 0; z-index: 10; }
    th {
      background: var(--bg2); color: var(--muted); font-weight: 700;
      padding: 1rem 0.875rem; text-transform: uppercase; font-size: 0.68rem;
      letter-spacing: 0.06em; border-bottom: 1px solid var(--border); white-space: nowrap;
    }
    td { padding: 0.75rem 0.875rem; border-bottom: 1px solid rgba(30,58,95,0.4); vertical-align: middle; }
    tr.alt td { background: rgba(255,255,255,0.015); }
    tr:hover td { background: rgba(59,130,246,0.05); }
    tr:last-child td { border-bottom: none; }
    td.mono { font-family: monospace; font-size: 0.75rem; color: var(--muted); }
    td.screen { font-weight: 700; color: var(--primary); }
    td.muted { color: var(--muted); }
    td.right { text-align: right; }
    .badge { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 0.375rem; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em; }
    .badge.passed { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); color: var(--success); }
    .badge.failed { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.25);  color: var(--danger); }
    .ss-link { color: var(--primary); text-decoration: none; font-weight: 700; font-size: 0.75rem; }
    .ss-link:hover { text-decoration: underline; }

    /* Footer */
    .footer { text-align: center; margin-top: 2rem; color: var(--muted); font-size: 0.75rem; }
  </style>
</head>
<body>
<div class="container">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>🏥 ${suiteName}</h1>
      <p>Generated: ${genTime} &nbsp;|&nbsp; 32 Screens × 10 Test Cases = 320 Selenium Test Cases</p>
    </div>
    <div class="badge-qa">QA COMPLIANCE REPORT</div>
  </div>

  <!-- Stats -->
  <div class="stats">
    <div class="stat-card"><div class="stat-label">Total Tests</div><div class="stat-value blue">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Passed</div><div class="stat-value green">${passed}</div></div>
    <div class="stat-card"><div class="stat-label">Failed</div><div class="stat-value red">${failed}</div></div>
    <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value yellow">${pending}</div></div>
    <div class="stat-card"><div class="stat-label">Pass Rate</div><div class="stat-value green">${rate}%</div></div>
    <div class="stat-card"><div class="stat-label">Total Time</div><div class="stat-value blue">${(elapsed/1000).toFixed(2)}s</div></div>
  </div>

  <!-- Charts -->
  <div class="charts">
    <div class="chart-card">
      <h3>Overall Results</h3>
      <div class="chart-wrap"><canvas id="donutChart"></canvas></div>
    </div>
    <div class="chart-card">
      <h3>Module Breakdown</h3>
      <div class="chart-wrap"><canvas id="barChart"></canvas></div>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="toolbar">
    <input type="text" id="searchInput" placeholder="🔍  Search test ID, screen, module, test case…" oninput="filterTable()">
    <button class="filter-btn active" id="btn-all"    onclick="setFilter('all')">All (${total})</button>
    <button class="filter-btn"        id="btn-passed" onclick="setFilter('passed')">✅ Passed (${passed})</button>
    <button class="filter-btn"        id="btn-failed" onclick="setFilter('failed')">❌ Failed (${failed})</button>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table id="resultsTable">
      <thead>
        <tr>
          <th>Test ID</th><th>Screen</th><th>Module</th><th>Test Case</th>
          <th>Expected</th><th>Actual</th><th>Status</th><th>Time</th><th>Screenshot</th>
        </tr>
      </thead>
      <tbody id="tableBody">${rows}</tbody>
    </table>
  </div>

  <div class="footer">Well Care Hospital AI Patient Monitoring System — QA Automation Framework v2.0 | ${genTime}</div>
</div>

<script>
  // ── Charts ─────────────────────────────────────────────────────────────────
  const donut = new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Passed', 'Failed', 'Pending'],
      datasets: [{ data: [${passed}, ${failed}, ${pending}], backgroundColor: ['#10b981','#ef4444','#f59e0b'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }
  });

  const bar = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: ${moduleLabels},
      datasets: [
        { label: 'Passed', data: ${modulePassed}, backgroundColor: 'rgba(16,185,129,0.7)' },
        { label: 'Failed', data: ${moduleFailed}, backgroundColor: 'rgba(239,68,68,0.7)' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: '#1e3a5f' } },
        y: { ticks: { color: '#64748b' }, grid: { color: '#1e3a5f' } }
      }
    }
  });

  // ── Filtering ──────────────────────────────────────────────────────────────
  let currentFilter = 'all';
  function setFilter(f) {
    currentFilter = f;
    ['all','passed','failed'].forEach(k => document.getElementById('btn-'+k).classList.toggle('active', k===f));
    filterTable();
  }
  function filterTable() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('#tableBody tr').forEach(row => {
      const text   = row.textContent.toLowerCase();
      const status = row.dataset.status;
      const matchSearch = !q || text.includes(q);
      const matchFilter = currentFilter === 'all' || status === currentFilter;
      row.style.display = matchSearch && matchFilter ? '' : 'none';
    });
  }
</script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, "utf8");
    Logger.info(`[HtmlReport] HTML saved: ${OUTPUT_FILE}`);
    return OUTPUT_FILE;
  }
}

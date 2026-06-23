const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const wbPath = path.join(__dirname, 'final-reports', 'WellCare_Detailed_Test_Report.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(wbPath);
  
  workbook.worksheets.forEach(sheet => {
    console.log(`\n=== Scanning sheet: ${sheet.name} ===`);
    // Print non-empty cells beyond column headers (say columns > 15) or rows that might look like summaries
    sheet.eachRow((row, rowIdx) => {
      // Look at cells beyond the standard columns to find side cards or summaries
      row.eachCell((cell, colIdx) => {
        if (colIdx > 15 || rowIdx > 330) {
          console.log(`Row ${rowIdx}, Col ${colIdx} (${excelColumnName(colIdx)}): val="${cell.value}"`);
        }
      });
    });
  });
}

function excelColumnName(colIdx) {
  let temp = colIdx;
  let letter = '';
  while (temp > 0) {
    let modulo = (temp - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    temp = Math.floor((temp - modulo) / 26);
  }
  return letter;
}

main().catch(err => console.error(err));

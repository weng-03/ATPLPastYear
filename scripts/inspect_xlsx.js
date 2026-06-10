const XLSX = require('xlsx');
const path = require('path');

const xlsxPath = path.join(__dirname, '../questions-data/MAS Pass Year Full.xlsx');
const workbook = XLSX.readFile(xlsxPath);

console.log("Sheet names:", workbook.SheetNames);

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Sheet: ${name}, Rows count: ${rows.length}`);
  if (rows.length > 0) {
    console.log("First row keys:", Object.keys(rows[0]));
    console.log("First row sample:", rows[0]);
  }
  console.log("-------------------------------------");
}

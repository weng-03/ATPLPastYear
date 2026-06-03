import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const dataDir = join(ROOT, "questions-data");

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    rows.push(fields);
  }
  return rows;
}

const csvFiles = readdirSync(dataDir).filter(f => f.toLowerCase().endsWith(".csv"));
let totalValid = 0;
let totalSkipped = 0;

console.log("--- CSV DIAGNOSTIC REPORT ---");

for (const file of csvFiles) {
  const filePath = join(dataDir, file);
  const text = readFileSync(filePath, "utf-8");
  const rows = parseCSV(text);
  
  if (rows.length < 2) continue;
  
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const idx = {
    chapter: headers.indexOf("chapter"),
    correct_answer: headers.indexOf("correct_answer"),
  };

  let valid = 0;
  let short = 0;
  let invalidAnswer = 0;
  let empty = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 8 || row.every((f) => !f)) {
      short++;
      continue;
    }

    const correctAnswer = row[idx.correct_answer]?.toUpperCase()?.trim();
    if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      invalidAnswer++;
      continue;
    }

    valid++;
  }

  totalValid += valid;
  const skipped = short + invalidAnswer + empty;
  totalSkipped += skipped;

  if (skipped > 0) {
    console.log(`\n📄 ${file}`);
    console.log(`   - Valid Questions: ${valid}`);
    console.log(`   - Skipped because missing columns (< 8): ${short}`);
    console.log(`   - Skipped because correct_answer isn't A/B/C/D: ${invalidAnswer}`);
  }
}

console.log(`\n================================`);
console.log(`TOTAL VALID ACROSS ALL CSVs: ${totalValid}`);
console.log(`TOTAL DROPPED: ${totalSkipped}`);
console.log(`================================\n`);

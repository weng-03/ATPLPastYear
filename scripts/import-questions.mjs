// ============================================================
// import-questions.mjs
//
// Reads all CSV files from the ./questions-data/ folder and
// uploads them to your Supabase `questions` table.
//
// HOW TO RUN:
//   node scripts/import-questions.mjs
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Load .env.local ──────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌  .env.local not found!");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("\n❌  Missing environment variables!");
  console.error("   Make sure .env.local has:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL=...");
  console.error("   SUPABASE_SERVICE_ROLE_KEY=...\n");
  process.exit(1);
}

// ── Supabase client (service role bypasses RLS) ───────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── CSV Parser ────────────────────────────────────────────────
// Handles quoted fields (e.g. "Lift, Drag, Thrust, Weight")
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

// ── Main import function ──────────────────────────────────────
async function importFile(filePath) {
  const fileName = filePath.split(/[/\\]/).pop();
  console.log(`\n📄 Processing: ${fileName}`);

  const text = readFileSync(filePath, "utf-8");
  const rows = parseCSV(text);

  if (rows.length < 2) {
    console.log(`   ⚠️  File appears empty or has no data rows. Skipping.`);
    return { inserted: 0, errors: 0 };
  }

  // Map headers to indexes
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const idx = {
    chapter: headers.indexOf("chapter"),
    question_number: headers.indexOf("question_number"),
    question_text: headers.indexOf("question_text"),
    option_a: headers.indexOf("option_a"),
    option_b: headers.indexOf("option_b"),
    option_c: headers.indexOf("option_c"),
    option_d: headers.indexOf("option_d"),
    correct_answer: headers.indexOf("correct_answer"),
  };

  // Check all required columns exist
  const missing = Object.entries(idx)
    .filter(([, v]) => v === -1)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.log(`   ❌  Missing columns: ${missing.join(", ")}`);
    console.log(`   Found headers: ${headers.join(", ")}`);
    return { inserted: 0, errors: rows.length - 1 };
  }

  // Build records
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 8 || row.every((f) => !f)) continue; // skip empty rows

    const correctAnswer = row[idx.correct_answer]?.toUpperCase()?.trim();
    if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      console.log(`   ⚠️  Row ${i + 1}: Invalid correct_answer "${correctAnswer}" — skipping`);
      continue;
    }

    records.push({
      chapter: row[idx.chapter]?.trim(),
      question_number: parseInt(row[idx.question_number]) || i,
      question_text: row[idx.question_text]?.trim(),
      option_a: row[idx.option_a]?.trim(),
      option_b: row[idx.option_b]?.trim(),
      option_c: row[idx.option_c]?.trim(),
      option_d: row[idx.option_d]?.trim(),
      correct_answer: correctAnswer,
    });
  }

  console.log(`   Found ${records.length} valid questions`);

  // Upload in batches of 500
  const BATCH = 500;
  let inserted = 0;
  let errors = 0;

  // Strip trailing slash from URL if present
  const baseUrl = SUPABASE_URL.replace(/\/$/, "");

  for (let start = 0; start < records.length; start += BATCH) {
    const batch = records.slice(start, start + BATCH);
    const end = Math.min(start + BATCH, records.length);

    process.stdout.write(`   Uploading rows ${start + 1}–${end}...`);

    try {
      const response = await fetch(`${baseUrl}/rest/v1/questions`, {
        method: "POST",
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const body = await response.text();
        console.log(` ❌ Error ${response.status}: ${body}`);
        errors += batch.length;
      } else {
        console.log(` ✅ Done`);
        inserted += batch.length;
      }
    } catch (err) {
      console.log(` ❌ Network error: ${err.message}`);
      errors += batch.length;
    }
  }

  return { inserted, errors };
}

// ── Run ───────────────────────────────────────────────────────
async function main() {
  console.log("===========================================");
  console.log("  ✈  GroundSchool Question Importer");
  console.log("===========================================");

  const dataDir = join(ROOT, "questions-data");

  if (!existsSync(dataDir)) {
    console.error(`\n❌  Folder not found: questions-data/`);
    console.error(`   Create it in your project root and put your CSV files inside.\n`);
    process.exit(1);
  }

  const csvFiles = readdirSync(dataDir)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .map((f) => join(dataDir, f));

  if (csvFiles.length === 0) {
    console.error(`\n❌  No CSV files found in questions-data/`);
    console.error(`   Make sure your files end in .csv\n`);
    process.exit(1);
  }

  console.log(`\nFound ${csvFiles.length} CSV file(s) to import.\n`);

  // Check current count
  const { count: before } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });
  console.log(`Questions in database before import: ${before ?? 0}`);

  let totalInserted = 0;
  let totalErrors = 0;

  for (const file of csvFiles) {
    const { inserted, errors } = await importFile(file);
    totalInserted += inserted;
    totalErrors += errors;
  }

  // Final count
  const { count: after } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  console.log("\n===========================================");
  console.log(`✅  Import complete!`);
  console.log(`   Questions inserted: ${totalInserted}`);
  if (totalErrors > 0) console.log(`   Skipped/errors:    ${totalErrors}`);
  console.log(`   Total in database: ${after ?? "?"}`);
  console.log("===========================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

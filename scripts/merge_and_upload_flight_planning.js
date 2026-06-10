const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// ── Load .env.local ──────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("❌  .env.local not found!");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    process.env[key] = val;
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Compile Explanations Map ────────────────────────────────
const explanationsMap = {};
const batchesDir = path.join(__dirname, '../questions-data/flight_planning_batches');

for (let i = 1; i <= 9; i++) {
  const batchFile = path.join(batchesDir, `batch_${i}.json`);
  if (!fs.existsSync(batchFile)) {
    console.error(`❌ Missing batch file: ${batchFile}`);
    process.exit(1);
  }
  const batchData = JSON.parse(fs.readFileSync(batchFile, 'utf-8'));
  for (const item of batchData) {
    explanationsMap[item.question_number.toString()] = item.explanation;
  }
}
console.log(`Loaded ${Object.keys(explanationsMap).length} explanations from flight planning batch files.`);

// ── Parse Original Flight Planning.csv ──────────────────────────────────
const csvFilePath = path.join(__dirname, '../questions-data/Flight Planning.csv');
const rows = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    rows.push(row);
  })
  .on('end', async () => {
    console.log(`Parsed ${rows.length} rows from Flight Planning.csv`);

    // ── Generate Completed CSV with Explanations ──────────────
    function escapeCSVValue(value) {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const outputHeaders = ['chapter', 'question_number', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
    let csvContent = outputHeaders.join(',') + '\n';

    for (const row of rows) {
      const qNumStr = row.question_number.trim();
      const exp = explanationsMap[qNumStr] || '';
      const csvRow = [
        row.chapter || 'Flight Planning',
        row.question_number,
        row.question_text,
        row.option_a,
        row.option_b,
        row.option_c,
        row.option_d,
        row.correct_answer,
        exp
      ];
      csvContent += csvRow.map(escapeCSVValue).join(',') + '\n';
    }

    // Overwrite original Flight Planning.csv
    fs.writeFileSync(csvFilePath, csvContent, 'utf-8');
    console.log(`Successfully updated and overwrote: ${csvFilePath}`);

    // ── Fetch Existing Flight Planning Questions in Supabase ─────────────
    console.log('Fetching existing Flight Planning questions from Supabase...');
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('id, chapter, question_number')
      .eq('chapter', 'Flight Planning');

    if (fetchError) {
      console.error('❌ Error fetching from Supabase:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${existingQuestions.length} existing Flight Planning questions in Supabase.`);

    const existingMap = {};
    for (const q of existingQuestions) {
      existingMap[q.question_number.toString()] = q.id;
    }

    const toInsert = [];
    const toUpdate = [];

    for (const row of rows) {
      const qNumStr = row.question_number.trim();
      const qNum = parseInt(qNumStr, 10);
      const exp = explanationsMap[qNumStr] || '';

      const payload = {
        chapter: 'Flight Planning',
        question_number: qNum,
        question_text: row.question_text,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_answer: row.correct_answer,
        explanation: exp
      };

      if (existingMap[qNumStr]) {
        payload.id = existingMap[qNumStr];
        toUpdate.push(payload);
      } else {
        toInsert.push(payload);
      }
    }

    console.log(`Planning to update ${toUpdate.length} rows and insert ${toInsert.length} new rows.`);

    // ── Upsert to Supabase in Batches ──────────────────────────
    async function upsertBatch(records, type) {
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error: upsertErr } = await supabase
          .from('questions')
          .upsert(batch);
        
          if (upsertErr) {
          console.error(`❌ Error on ${type} batch ${i / 100 + 1}:`, upsertErr);
        } else {
          console.log(`✅ Successfully upserted ${type} batch ${i / 100 + 1}`);
        }
      }
    }

    if (toUpdate.length > 0) {
      await upsertBatch(toUpdate, 'update');
    }
    if (toInsert.length > 0) {
      await upsertBatch(toInsert, 'insert');
    }

    console.log('🎉 Done uploading all Flight Planning explanations to Supabase.');
  });

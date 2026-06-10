const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const results = [];
const csvFilePath = path.join(__dirname, '../questions-data/AirLaw_temp.csv');

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`Parsed ${results.length} rows from CSV`);

    // Fetch existing "Air Law" or "AirLaw" questions
    const { data: existingQuestions, error } = await supabase
      .from('questions')
      .select('id, chapter, question_number')
      .in('chapter', ['Air Law', 'AirLaw']);

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return;
    }

    const existingMap = {};
    for (const q of existingQuestions) {
      existingMap[q.question_number] = q.id;
    }

    const toInsert = [];
    const toUpdate = [];

    for (const row of results) {
      const qNum = parseInt(row.question_number, 10);
      const payload = {
        chapter: 'Air Law', // Using the formatted name
        question_number: qNum,
        question_text: row.question_text,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_answer: row.correct_answer,
        explanation: row.explanation
      };

      if (existingMap[qNum]) {
        payload.id = existingMap[qNum];
        toUpdate.push(payload);
      } else {
        toInsert.push(payload);
      }
    }

    console.log(`Found ${toUpdate.length} to update, ${toInsert.length} to insert.`);

    // Helper to upload in batches
    async function upsertBatch(records, type) {
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error: upsertErr } = await supabase
          .from('questions')
          .upsert(batch);
        
        if (upsertErr) {
          console.error(`Error on ${type} batch ${i / 100 + 1}:`, upsertErr);
        } else {
          console.log(`Successfully upserted ${type} batch ${i / 100 + 1}`);
        }
      }
    }

    await upsertBatch(toUpdate, 'update');
    await upsertBatch(toInsert, 'insert');

    console.log('Done uploading explanations to Supabase.');
  });

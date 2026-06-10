const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    process.env[key] = val;
  }
}

loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const toDelete = JSON.parse(fs.readFileSync('to_delete.json', 'utf-8'));
  console.log(`Deleting ${toDelete.length} duplicate questions...`);
  
  let deletedCount = 0;
  // delete in batches of 100
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const { error } = await supabase.from('questions').delete().in('id', batch);
    if (error) {
      console.error(`Error deleting batch ${i/100 + 1}:`, error);
    } else {
      deletedCount += batch.length;
      console.log(`Deleted batch ${i/100 + 1} (${deletedCount} total)`);
    }
  }
  
  console.log('Finished deleting duplicates.');
}

run();

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

async function test() {
  const allData = [];
  let start = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, chapter, question_number')
      .range(start, start + limit - 1);
      
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    if (data.length === 0) break;
    
    allData.push(...data);
    start += limit;
  }
  
  const byQNum = {};
  
  for (const row of allData) {
    const qNum = row.question_number;
    if (!byQNum[qNum]) {
      byQNum[qNum] = [];
    }
    byQNum[qNum].push({ id: row.id, chapter: row.chapter });
  }
  
  const toDeleteIds = [];
  let duplicatedQnums = 0;
  
  for (const [qNum, list] of Object.entries(byQNum)) {
    if (list.length > 1) {
      duplicatedQnums++;
      console.log(`Question ${qNum} appears in:`, list.map(x => x.chapter).join(', '));
      // Keep the first one, delete the rest
      for (let i = 1; i < list.length; i++) {
        toDeleteIds.push(list[i].id);
      }
    }
  }
  
  console.log(`Total duplicated question numbers: ${duplicatedQnums}`);
  console.log(`Rows to delete: ${toDeleteIds.length}`);
  
  fs.writeFileSync('to_delete.json', JSON.stringify(toDeleteIds, null, 2));
}

test();

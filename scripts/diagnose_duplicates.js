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
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error fetching count:', countError);
    return;
  }
  
  console.log(`Total questions count from DB (metadata): ${count}`);
  
  // Fetch all using pagination
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
  
  console.log(`Fetched ${allData.length} questions from DB.`);
  
  const byChapter = {};
  const duplicates = {};
  
  for (const row of allData) {
    const chapter = row.chapter;
    const qNum = row.question_number;
    
    if (!byChapter[chapter]) {
      byChapter[chapter] = { count: 0, nums: {} };
    }
    
    byChapter[chapter].count++;
    
    if (!byChapter[chapter].nums[qNum]) {
      byChapter[chapter].nums[qNum] = [];
    }
    byChapter[chapter].nums[qNum].push(row.id);
  }
  
  let totalDuplicates = 0;
  for (const [chapter, info] of Object.entries(byChapter)) {
    console.log(`Chapter: ${chapter}, Total: ${info.count}`);
    let dupCount = 0;
    for (const [qNum, ids] of Object.entries(info.nums)) {
      if (ids.length > 1) {
        dupCount += (ids.length - 1);
        if (!duplicates[chapter]) duplicates[chapter] = [];
        duplicates[chapter].push({ qNum, ids });
      }
    }
    if (dupCount > 0) {
      console.log(`  -> Found ${dupCount} duplicate rows in ${chapter}`);
      totalDuplicates += dupCount;
    }
  }
  
  console.log(`Total duplicate rows to remove: ${totalDuplicates}`);
  fs.writeFileSync('duplicates.json', JSON.stringify(duplicates, null, 2));
}

test();

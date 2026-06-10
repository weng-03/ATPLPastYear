const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function callModelWithRetry(model, prompt, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      attempt++;
      const isRateLimit = err.message.includes("429") || err.message.includes("Too Many Requests") || err.message.includes("Quota exceeded");
      if (isRateLimit && attempt < maxRetries) {
        // Try to parse the retry delay
        let delayMs = 30000; // default to 30 seconds
        const match = err.message.match(/Please retry in ([\d\.]+)s/);
        if (match && match[1]) {
          delayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
        } else {
          delayMs = delayMs * Math.pow(2, attempt - 1);
        }
        console.log(`\n[Rate Limit] Attempt ${attempt} failed. Retrying in ${Math.round(delayMs/1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }
}

async function generateExplanationsForFolder(folderName) {
  const model = genAI.getGenerativeModel({ model: "antigravity-preview-05-2026" });
  const batchesDir = path.join(__dirname, '../questions-data', folderName);
  
  if (!fs.existsSync(batchesDir)) {
    console.error(`Directory not found: ${batchesDir}`);
    return;
  }

  const files = fs.readdirSync(batchesDir).filter(f => f.endsWith('.json')).sort((a,b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
  });
  
  console.log(`Starting to solve batches in ${folderName}...`);
  
  for (const file of files) {
    const filePath = path.join(batchesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    console.log(`Processing ${file} (${data.length} questions)...`);
    let modified = false;
    
    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      if (q.explanation && q.explanation.trim().length > 0) {
        continue;
      }
      
      const prompt = `You are an ATPL Instructor. Given this question and the correct answer, provide a 2 to 3 sentence explanation for why the answer is correct.
      
Question: ${q.question_text}
Options:
A: ${q.options.A}
B: ${q.options.B}
C: ${q.options.C}
D: ${q.options.D}
Correct Answer: ${q.correct_answer} (${q.options[q.correct_answer]})

Explain simply and clearly. Output ONLY the 2-3 sentence explanation without any formatting or prefix.`;

      try {
        const text = await callModelWithRetry(model, prompt);
        q.explanation = text;
        modified = true;
        process.stdout.write('.');
      } catch (err) {
        console.error(`\nError generating explanation for question ${q.question_number} in ${file}:`, err.message);
        if (modified) {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        }
        throw err;
      }
      
      // small delay to prevent rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    console.log(`\nFinished ${file}`);
  }
  console.log(`All batches in ${folderName} processed successfully!`);
}

async function run() {
  const targetFolder = process.argv[2];
  if (!targetFolder) {
    console.log("Usage: node solve_subject_generic.js <folder_name_under_questions-data>");
    console.log("Example: node solve_subject_generic.js mass_balance_batches");
    process.exit(1);
  }
  try {
    await generateExplanationsForFolder(targetFolder);
  } catch (e) {
    console.error("Execution failed:", e.message);
    process.exit(1);
  }
}

run();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function generateExplanations() {
  const model = genAI.getGenerativeModel({ model: "antigravity-preview-05-2026" });
  
  const batchesDir = path.join(__dirname, '../questions-data/flight_planning_batches');
  const files = fs.readdirSync(batchesDir).filter(f => f.endsWith('.json')).sort((a,b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
  });
  
  for (const file of files) {
    const filePath = path.join(batchesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    console.log(`Processing ${file}...`);
    let modified = false;
    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      if (q.explanation) continue;
      
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
        const result = await model.generateContent(prompt);
        q.explanation = result.response.text().trim();
        modified = true;
        process.stdout.write('.');
      } catch (err) {
        console.error(`\nError generating explanation for question ${q.question_number}:`, err.message);
        if (modified) {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    console.log(`\nFinished ${file}`);
  }
}

generateExplanations().then(() => console.log('All done.')).catch(console.error);

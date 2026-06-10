const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const csvFilePath = path.join(__dirname, '../questions-data/HPL.csv');
const outputDir = path.join(__dirname, '../questions-data/hpl_batches');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const results = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    let batchNum = 1;
    for (let i = 0; i < results.length; i += 50) {
      const batch = results.slice(i, i + 50);
      const simplifiedBatch = batch.map(q => ({
        question_number: q.question_number,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d
        }
      }));
      fs.writeFileSync(
        path.join(outputDir, `batch_${batchNum}.json`),
        JSON.stringify(simplifiedBatch, null, 2)
      );
      batchNum++;
    }
    console.log(`Created ${batchNum - 1} batches.`);
  });

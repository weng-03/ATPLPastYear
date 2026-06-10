const fs = require('fs');

const logPath = 'C:/Users/Acer/.gemini/antigravity-ide/brain/e4e23879-940a-4e5f-be2e-5418b38a85a8/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);
  if (line.includes('solve_met_chunk_2.js') && obj.tool_calls) {
    for (const tc of obj.tool_calls) {
      if (tc.name === 'write_to_file') {
        console.log(`Step ${obj.step_index} wrote file: ${tc.args.TargetFile}`);
        console.log(tc.args.CodeContent.slice(0, 1000));
      }
    }
  }
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Explain why the sky is blue in one sentence.");
    console.log(`Success with ${modelName}:`, result.response.text());
  } catch (e) {
    console.log(`Failed with ${modelName}:`, e.message);
  }
}

async function run() {
  await testModel("antigravity-preview-05-2026");
}

run();

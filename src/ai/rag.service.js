const OpenAI = require("openai");
const client = require("../config/qdrant");
const { generateEmbedding } = require("./embedding.service");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.askQuestion = async (projectId, question) => {

  // 1. Convert question to embedding
  const queryEmbedding = await generateEmbedding(question);

  // 2. Search similar chunks in Qdrant
  const searchResult = await client.search("project_documents", {
    vector: queryEmbedding,
    limit: 5,
    filter: {
      must: [
        {
          key: "project_id",
          match: { value: projectId }
        }
      ]
    }
  });

  const contexts = searchResult.map(item => item.payload.text);

  // 3. Build prompt
  const prompt = `
You are an assistant answering strictly from provided context.

Context:
${contexts.join("\n---\n")}

Question:
${question}

If answer is not in context, say "I don't know".
`;

  // 4. Call OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ]
  });

  return response.choices[0].message.content;
};
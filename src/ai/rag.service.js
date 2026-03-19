const OpenAI = require("openai");
const client = require("../config/qdrant");
const { generateEmbedding } = require("./embedding.service");
const AppError = require("../utils/AppError");
const { ensureProjectIdIndex } = require("./qdrant-index.service");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.askQuestion = async (projectId, question) => {

  // 1. Convert question to embedding
  const queryEmbedding = await generateEmbedding(question);

  // 2. Search similar chunks in Qdrant
  let searchResult;
  try {
    await ensureProjectIdIndex();
    searchResult = await client.search("project_documents", {
      vector: queryEmbedding,
      limit: 5,
      filter: {
        must: [
          {
            key: "project_id",
            match: { value: projectId },
          },
        ],
      },
    });
  } catch (err) {
    const upstreamMessage =
      err?.response?.data?.status?.error ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.data?.status?.error ||
      err?.data?.message ||
      err?.data?.error ||
      err?.message;

    throw new AppError(400, upstreamMessage || "Vector search failed", {
      cause: err,
    });
  }

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
  let response;
  try {
    response = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    });
  } catch (err) {
    const upstreamMessage =
      err?.error?.message ||
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.data?.error?.message ||
      err?.data?.message ||
      err?.message;

    throw new AppError(400, upstreamMessage || "LLM call failed", {
      cause: err,
    });
  }

  return response.choices[0].message.content;
};

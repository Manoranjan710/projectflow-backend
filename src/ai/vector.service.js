const client = require("../config/qdrant");

exports.storeVectors = async (projectId, chunks, embeddings) => {

  const points = chunks.map((chunk, index) => ({
    id: `${projectId}-${index}-${Date.now()}`,
    vector: embeddings[index],
    payload: {
      project_id: projectId,
      text: chunk
    }
  }));

  await client.upsert("project_documents", {
    points
  });
};
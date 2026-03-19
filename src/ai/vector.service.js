const client = require("../config/qdrant");
const { v4: uuidv4 } = require("uuid");

exports.storeVectors = async (projectId, chunks, embeddings) => {

  const points = chunks.map((chunk, index) => ({
    id: uuidv4(),
    vector: embeddings[index],
    payload: {
      project_id: projectId,
      chunk_index: index,
      text: chunk,
    }
  }));

  await client.upsert("project_documents", {
    points
  });
};

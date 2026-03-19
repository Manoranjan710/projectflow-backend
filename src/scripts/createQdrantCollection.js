const client = require("../config/qdrant");

async function createCollection() {
  try {

    await client.createCollection("project_documents", {
      vectors: {
        size: 1536,
        distance: "Cosine"
      }
    });

    console.log("✅ Collection created successfully");

  } catch (err) {

    console.error("❌ Error creating collection:", err.message);

  }
}

createCollection();
const client = require("../config/qdrant");

async function createCollection() {
  try {
    const collectionName = "project_documents";
    console.log(`Using Qdrant URL: ${process.env.QDRANT_URL || "(not set)"}`);
    if (client?._restUri) console.log(`Qdrant REST URI: ${client._restUri}`);

    await client.createCollection(collectionName, {
      vectors: {
        size: 1536,
        distance: "Cosine"
      }
    });

    console.log("✅ Collection created successfully");

  } catch (err) {
    if (err?.cause) console.error("Cause:", err.cause);
    if (err?.stack) console.error(err.stack);

    console.error("❌ Error creating collection:", err.message);

  }
}

createCollection();

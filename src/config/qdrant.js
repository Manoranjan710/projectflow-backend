require("dotenv").config({ quiet: true });

const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY;

if (!qdrantUrl) {
  throw new Error(
    "QDRANT_URL is not set. Add it to .env (e.g. http://127.0.0.1:6333 or your Qdrant Cloud URL)."
  );
}

const checkCompatibilityRaw = process.env.QDRANT_CHECK_COMPATIBILITY;
const checkCompatibility =
  checkCompatibilityRaw == null
    ? true
    : !["0", "false", "no"].includes(String(checkCompatibilityRaw).toLowerCase());

const client = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
  checkCompatibility,
});

module.exports = client;

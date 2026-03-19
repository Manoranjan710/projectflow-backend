const client = require("../config/qdrant");

let ensurePromise;

async function ensureProjectIdIndex() {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    try {
      await client.createPayloadIndex("project_documents", {
        wait: true,
        field_name: "project_id",
        field_schema: "keyword",
      });
    } catch (err) {
      const message =
        err?.response?.data?.status?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "";

      const status = err?.status || err?.response?.status;

      // If the index already exists, Qdrant may return 409 or an error message.
      const alreadyExists =
        status === 409 ||
        /already exists/i.test(message) ||
        /already.*indexed/i.test(message);

      if (!alreadyExists) {
        ensurePromise = undefined;
        throw err;
      }
    }
  })();

  return ensurePromise;
}

module.exports = {
  ensureProjectIdIndex,
};

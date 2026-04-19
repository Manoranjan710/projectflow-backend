const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.warn("⚠️  Redis reconnection failed after 3 attempts. Running without cache.");
        return new Error("Redis max retries exceeded");
      }
      return 1000 * (retries + 1);
    },
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected");
});

redisClient.on("ready", () => {
  console.log("✅ Redis Ready");
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn("⚠️  Could not connect to Redis:", err.message);
      console.warn("⚠️  App will run without caching. To enable caching, start Redis server.");
      // Don't throw - allow app to continue without Redis
    }
  }
};

module.exports = { redisClient, connectRedis };
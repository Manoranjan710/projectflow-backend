const { redisClient } = require("../config/redis");

const getCache = async (key) => {
  try {
    if (!redisClient.isOpen) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn("⚠️  Cache GET error:", err.message);
    return null;
  }
};

const setCache = async (key, value, ttl = 300) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.warn("⚠️  Cache SET error:", err.message);
  }
};

const deleteCache = async (key) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(key);
  } catch (err) {
    console.warn("⚠️  Cache DEL error:", err.message);
  }
};

const deleteCacheByPattern = async (pattern) => {
  try {
    if (!redisClient.isOpen) return;

    const keys = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }

    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    console.warn("⚠️  Cache DEL pattern error:", err.message);
  }
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
};
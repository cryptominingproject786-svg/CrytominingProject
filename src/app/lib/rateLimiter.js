import { getRedisClient } from "./redisClient";

// Simple Redis-backed rate limiter with in-memory fallback
class RateLimiter {
    constructor({ windowMs = 60_000, max = 10 } = {}) {
        this.windowMs = windowMs;
        this.max = max;
        this.redis = getRedisClient();
        this.memory = new Map();
    }

    async consume(key) {
        const now = Date.now();
        if (this.redis) {
            try {
                const redisKey = `rl:${key}`;
                const count = await this.redis.incr(redisKey);
                if (count === 1) {
                    await this.redis.pexpire(redisKey, this.windowMs);
                }
                const ttl = await this.redis.pttl(redisKey);
                const remaining = Math.max(0, this.max - count);
                return { allowed: count <= this.max, remaining, reset: now + ttl };
            } catch (err) {
                console.warn("[RateLimiter] Redis unavailable, falling back to in-memory", err?.message || err);
                this.redis = null;
            }
        }

        // In-memory fallback (not suitable for multi-instance production)
        let entry = this.memory.get(key);
        if (!entry) {
            entry = { timestamps: [] };
            this.memory.set(key, entry);
        }

        // remove old
        entry.timestamps = entry.timestamps.filter((t) => t > now - this.windowMs);
        entry.timestamps.push(now);

        const count = entry.timestamps.length;
        const remaining = Math.max(0, this.max - count);
        const reset = entry.timestamps[0] ? entry.timestamps[0] + this.windowMs : now + this.windowMs;
        return { allowed: count <= this.max, remaining, reset };
    }
}

// Singleton with sensible defaults
const limiter = new RateLimiter({ windowMs: 60_000, max: 10 });
export default limiter;

import { redisGet, redisSet, redisDel } from "./redisClient";

export async function getCachedJson(key) {
    const raw = await redisGet(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (err) {
        console.warn("[Cache] JSON parse failed for key", key, err?.message || err);
        return null;
    }
}

export async function setCachedJson(key, value, ttlSeconds = 60) {
    try {
        const payload = typeof value === "string" ? value : JSON.stringify(value);
        return await redisSet(key, payload, ttlSeconds);
    } catch (err) {
        console.warn("[Cache] set failed for key", key, err?.message || err);
        return false;
    }
}

export async function invalidateCache(key) {
    return await redisDel(key);
}

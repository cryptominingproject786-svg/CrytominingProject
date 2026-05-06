import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const REDIS_URL = process.env.REDIS_URL;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || "bittxs";

const redisOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    keepAlive: 60000,
    retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 200);
    },
};

let redisClient = null;
let redisClientType = null;

function createRedisClient() {
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
        redisClientType = "upstash";
        return new UpstashRedis({
            url: UPSTASH_REDIS_REST_URL,
            token: UPSTASH_REDIS_REST_TOKEN,
        });
    }

    if (REDIS_URL) {
        redisClientType = "ioredis";
        const client = new Redis(REDIS_URL, redisOptions);

        client.on("error", (error) => {
            console.warn("[Redis] connection error:", error?.message || error);
        });

        client.on("connect", () => {
            console.log("[Redis] client connected");
        });

        client.on("end", () => {
            console.warn("[Redis] connection ended");
        });

        return client;
    }

    return null;
}

function getGlobalRedis() {
    if (!redisClient) {
        redisClient = createRedisClient();
    }
    return redisClient;
}

export function getRedisClient() {
    return getGlobalRedis();
}

export async function redisGet(key) {
    const client = getGlobalRedis();
    if (!client) return null;
    try {
        return await client.get(`${REDIS_KEY_PREFIX}:${key}`);
    } catch (error) {
        console.warn("[Redis] get failed:", error?.message || error);
        return null;
    }
}

export async function redisSet(key, value, ttlSeconds = 60) {
    const client = getGlobalRedis();
    if (!client) return false;
    try {
        if (redisClientType === "upstash") {
            if (ttlSeconds > 0) {
                await client.set(`${REDIS_KEY_PREFIX}:${key}`, value, { ex: ttlSeconds });
            } else {
                await client.set(`${REDIS_KEY_PREFIX}:${key}`, value);
            }
        } else {
            if (ttlSeconds > 0) {
                await client.set(`${REDIS_KEY_PREFIX}:${key}`, value, "EX", ttlSeconds);
            } else {
                await client.set(`${REDIS_KEY_PREFIX}:${key}`, value);
            }
        }
        return true;
    } catch (error) {
        console.warn("[Redis] set failed:", error?.message || error);
        return false;
    }
}

export async function redisDel(key) {
    const client = getGlobalRedis();
    if (!client) return false;
    try {
        await client.del(`${REDIS_KEY_PREFIX}:${key}`);
        return true;
    } catch (error) {
        console.warn("[Redis] del failed:", error?.message || error);
        return false;
    }
}

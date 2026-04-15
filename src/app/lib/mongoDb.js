import dns from "dns";
import mongoose from "mongoose";

let cached = global._mongo;
if (!cached) {
    cached = global._mongo = { conn: null, promise: null };
}

function createConnectionPromise(uri) {
    mongoose.set("strictQuery", true);
    return mongoose.connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
    });
}

async function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error("Please define MONGODB_URI environment variable (e.g. in .env.local)");
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = createConnectionPromise(MONGODB_URI);
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (err) {
        cached.promise = null;

        const shouldRetryWithPublicDns =
            MONGODB_URI.startsWith("mongodb+srv://") &&
            (err?.message?.includes("querySrv") || err?.message?.includes("_mongodb._tcp") || err?.code === "ENOTFOUND" || err?.code === "ECONNREFUSED");

        if (shouldRetryWithPublicDns) {
            dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
            try {
                cached.promise = createConnectionPromise(MONGODB_URI);
                cached.conn = await cached.promise;
                return cached.conn;
            } catch (retryErr) {
                cached.promise = null;
                throw retryErr;
            }
        }

        throw err;
    }
}

export default connectDB;

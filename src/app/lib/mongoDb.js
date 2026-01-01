import mongoose from "mongoose";

// Defer checking MONGODB_URI until connect time so module import won't throw
// (helps in dev and when running code that doesn't need DB access).
// The value is re-read at connection time to pick up env changes in some runtimes.

// Use a stable global cache to avoid reconnecting during HMR
let cached = global._mongo;
if (!cached) {
    cached = global._mongo = { conn: null, promise: null };
}

async function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error("Please define MONGODB_URI environment variable (e.g. in .env.local)");
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        mongoose.set("strictQuery", true);
        cached.promise = mongoose.connect(MONGODB_URI, {
            // avoid buffering commands when not connected (good for serverless)
            bufferCommands: false,
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (err) {
        cached.promise = null;
        throw err;
    }
}

export default connectDB;

import dns from "dns";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
};

if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

let cached = global._mongoClient;
if (!cached) {
    cached = global._mongoClient = { client: null, promise: null };
}

function createClientPromise() {
    cached.client = new MongoClient(uri, options);
    return cached.client.connect();
}

async function connectMongoClient() {
    if (!cached.promise) {
        cached.promise = createClientPromise();
    }

    try {
        return await cached.promise;
    } catch (err) {
        cached.promise = null;

        const shouldRetryWithPublicDns =
            uri.startsWith("mongodb+srv://") &&
            (err?.message?.includes("querySrv") ||
                err?.message?.includes("_mongodb._tcp") ||
                err?.code === "ENOTFOUND" ||
                err?.code === "ECONNREFUSED");

        if (shouldRetryWithPublicDns) {
            dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
            cached.promise = createClientPromise();
            try {
                return await cached.promise;
            } catch (retryErr) {
                cached.promise = null;
                throw retryErr;
            }
        }

        throw err;
    }
}

export default connectMongoClient();

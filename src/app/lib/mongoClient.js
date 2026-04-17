import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

let client;
let clientPromise;

if (global._mongoClientPromise) {
    clientPromise = global._mongoClientPromise;
} else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
    global._mongoClientPromise = clientPromise;
}

export default clientPromise;

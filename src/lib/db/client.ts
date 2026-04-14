import { type Db, MongoClient } from "mongodb";

const uri = import.meta.env.MONGODB_URI;
const dbName = import.meta.env.MONGODB_DB;

if (!uri || !dbName) {
	throw new Error("MONGODB_URI and MONGODB_DB must be set in environment");
}

declare global {
	var __mongoClient: MongoClient | undefined;
	var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const client =
	globalThis.__mongoClient ?? new MongoClient(uri, { maxPoolSize: 10 });
const clientPromise = globalThis.__mongoClientPromise ?? client.connect();

if (import.meta.env.DEV) {
	globalThis.__mongoClient = client;
	globalThis.__mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
	const c = await clientPromise;
	return c.db(dbName);
}

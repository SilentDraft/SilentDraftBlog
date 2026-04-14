import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
	console.error("MONGODB_URI and MONGODB_DB must be set in .env");
	process.exit(1);
}

const client = new MongoClient(uri);

async function main() {
	await client.connect();
	const db = client.db(dbName);

	const collections = [
		"posts",
		"projects",
		"tags",
		"quickInfo",
		"socials",
		"workExperience",
		"pages",
		"images",
	];

	for (const name of collections) {
		const exists = await db.listCollections({ name }).hasNext();
		if (!exists) {
			await db.createCollection(name);
			console.log(`created collection: ${name}`);
		}
	}

	await db.collection("posts").createIndexes([
		{ key: { slug: 1 }, unique: true, name: "slug_unique" },
		{ key: { draft: 1, createdAt: -1 }, name: "draft_createdAt" },
		{ key: { tags: 1 }, name: "tags" },
	]);

	await db.collection("projects").createIndexes([
		{ key: { slug: 1 }, unique: true, name: "slug_unique" },
		{ key: { date: -1 }, name: "date_desc" },
	]);

	await db
		.collection("tags")
		.createIndex({ id: 1 }, { unique: true, name: "id_unique" });

	await db
		.collection("quickInfo")
		.createIndex({ order: 1 }, { name: "order_asc" });

	await db
		.collection("socials")
		.createIndex({ order: 1 }, { name: "order_asc" });

	await db
		.collection("workExperience")
		.createIndex({ order: 1 }, { name: "order_asc" });

	await db
		.collection("pages")
		.createIndex({ slug: 1 }, { unique: true, name: "slug_unique" });

	await db
		.collection("images")
		.createIndex({ uploadedAt: -1 }, { name: "uploadedAt_desc" });

	console.log("indexes created");
	await client.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

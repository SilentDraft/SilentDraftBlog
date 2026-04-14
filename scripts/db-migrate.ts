import { readFile, readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import { config } from "dotenv";
import matter from "gray-matter";
import { MongoClient } from "mongodb";

config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
	console.error("MONGODB_URI and MONGODB_DB must be set");
	process.exit(1);
}

const CONTENT_DIR = join(process.cwd(), "src/content");

type AnyObj = Record<string, unknown>;

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, "utf-8")) as T;
}

async function readMdxDir(dir: string) {
	const entries = await readdir(dir);
	const out: Array<{ slug: string; data: AnyObj; body: string }> = [];
	for (const entry of entries) {
		if (!/\.(md|mdx)$/.test(entry)) continue;
		const full = join(dir, entry);
		const raw = await readFile(full, "utf-8");
		const parsed = matter(raw);
		out.push({
			slug: parse(entry).name,
			data: parsed.data as AnyObj,
			body: parsed.content,
		});
	}
	return out;
}

function toDate(v: unknown): Date {
	if (v instanceof Date) return v;
	if (typeof v === "string") return new Date(v);
	if (typeof v === "number") return new Date(v);
	return new Date();
}

async function main() {
	const client = new MongoClient(uri!);
	await client.connect();
	const db = client.db(dbName!);

	const tags = await readJson<Array<{ id: string }>>(
		join(CONTENT_DIR, "tags.json"),
	);
	if (tags.length) {
		await db.collection("tags").deleteMany({});
		await db.collection("tags").insertMany(tags);
		console.log(`migrated tags: ${tags.length}`);
	}

	const info = await readJson<
		Array<{ id: number; icon: AnyObj; text: string }>
	>(join(CONTENT_DIR, "info.json"));
	if (info.length) {
		await db.collection("quickInfo").deleteMany({});
		await db.collection("quickInfo").insertMany(
			info.map((x, i) => ({
				order: typeof x.id === "number" ? x.id : i,
				icon: x.icon,
				text: x.text,
			})),
		);
		console.log(`migrated quickInfo: ${info.length}`);
	}

	const socials = await readJson<
		Array<{ id: number; icon: AnyObj; text: string; link: string }>
	>(join(CONTENT_DIR, "socials.json"));
	if (socials.length) {
		await db.collection("socials").deleteMany({});
		await db.collection("socials").insertMany(
			socials.map((x, i) => ({
				order: typeof x.id === "number" ? x.id : i,
				icon: x.icon,
				text: x.text,
				link: x.link,
			})),
		);
		console.log(`migrated socials: ${socials.length}`);
	}

	const work = await readJson<
		Array<{
			id: number;
			title: string;
			company: string;
			duration: string;
			description: string;
		}>
	>(join(CONTENT_DIR, "work.json"));
	if (work.length) {
		await db.collection("workExperience").deleteMany({});
		await db.collection("workExperience").insertMany(
			work.map((x, i) => ({
				order: typeof x.id === "number" ? x.id : i,
				title: x.title,
				company: x.company,
				duration: x.duration,
				description: x.description,
			})),
		);
		console.log(`migrated workExperience: ${work.length}`);
	}

	const posts = await readMdxDir(join(CONTENT_DIR, "posts"));
	for (const { slug, data, body } of posts) {
		const doc = {
			slug,
			title: String(data.title ?? slug),
			description: String(data.description ?? ""),
			body,
			tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
			image: data.image ? String(data.image) : null,
			draft: data.draft === true,
			createdAt: toDate(data.createdAt),
			updatedAt: data.updatedAt ? toDate(data.updatedAt) : null,
		};
		await db
			.collection("posts")
			.updateOne({ slug }, { $set: doc }, { upsert: true });
	}
	console.log(`migrated posts: ${posts.length}`);

	const projects = await readMdxDir(join(CONTENT_DIR, "projects"));
	for (const { slug, data, body } of projects) {
		const doc = {
			slug,
			title: String(data.title ?? slug),
			description: String(data.description ?? ""),
			body,
			image: String(data.image ?? ""),
			link: data.link ? String(data.link) : null,
			date: toDate(data.date),
			info: Array.isArray(data.info) ? data.info : [],
		};
		await db
			.collection("projects")
			.updateOne({ slug }, { $set: doc }, { upsert: true });
	}
	console.log(`migrated projects: ${projects.length}`);

	const pages = await readMdxDir(join(CONTENT_DIR, "other"));
	for (const { slug, body } of pages) {
		await db
			.collection("pages")
			.updateOne({ slug }, { $set: { slug, body } }, { upsert: true });
	}
	console.log(`migrated pages: ${pages.length}`);

	await client.close();
	console.log("done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

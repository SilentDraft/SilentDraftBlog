import { getDb } from "../client";
import type { Post } from "../types";

export async function listPosts(options: { includeDrafts?: boolean } = {}) {
	const db = await getDb();
	const filter = options.includeDrafts ? {} : { draft: false };
	return db
		.collection<Post>("posts")
		.find(filter)
		.sort({ createdAt: -1 })
		.toArray();
}

export async function getPostBySlug(slug: string) {
	const db = await getDb();
	return db.collection<Post>("posts").findOne({ slug });
}

export async function upsertPost(
	slug: string,
	data: Omit<Post, "_id" | "slug" | "createdAt"> & { createdAt?: Date },
) {
	const db = await getDb();
	const now = new Date();
	const { createdAt, ...rest } = data;
	const result = await db.collection<Post>("posts").findOneAndUpdate(
		{ slug },
		{
			$set: { ...rest, updatedAt: now },
			$setOnInsert: { slug, createdAt: createdAt ?? now },
		},
		{ upsert: true, returnDocument: "after" },
	);
	return result;
}

export async function deletePost(slug: string) {
	const db = await getDb();
	return db.collection<Post>("posts").deleteOne({ slug });
}

export async function renamePostSlug(oldSlug: string, newSlug: string) {
	const db = await getDb();
	return db
		.collection<Post>("posts")
		.updateOne(
			{ slug: oldSlug },
			{ $set: { slug: newSlug, updatedAt: new Date() } },
		);
}

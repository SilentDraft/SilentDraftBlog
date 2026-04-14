import { getDb } from "../client";
import type {
	ImageMeta,
	QuickInfoItem,
	SocialItem,
	StaticPage,
	Tag,
	WorkExperienceItem,
} from "../types";

export async function listTags() {
	const db = await getDb();
	return db.collection<Tag>("tags").find({}).sort({ id: 1 }).toArray();
}

export async function listQuickInfo() {
	const db = await getDb();
	return db
		.collection<QuickInfoItem>("quickInfo")
		.find({})
		.sort({ order: 1 })
		.toArray();
}

export async function listSocials() {
	const db = await getDb();
	return db
		.collection<SocialItem>("socials")
		.find({})
		.sort({ order: 1 })
		.toArray();
}

export async function listWorkExperience() {
	const db = await getDb();
	return db
		.collection<WorkExperienceItem>("workExperience")
		.find({})
		.sort({ order: 1 })
		.toArray();
}

export async function getPage(slug: string) {
	const db = await getDb();
	return db.collection<StaticPage>("pages").findOne({ slug });
}

export async function upsertPage(slug: string, body: string) {
	const db = await getDb();
	return db
		.collection<StaticPage>("pages")
		.findOneAndUpdate(
			{ slug },
			{ $set: { body }, $setOnInsert: { slug } },
			{ upsert: true, returnDocument: "after" },
		);
}

export async function listImages() {
	const db = await getDb();
	return db
		.collection<ImageMeta>("images")
		.find({})
		.sort({ uploadedAt: -1 })
		.toArray();
}

export async function insertImage(data: Omit<ImageMeta, "_id">) {
	const db = await getDb();
	return db.collection<ImageMeta>("images").insertOne(data as ImageMeta);
}

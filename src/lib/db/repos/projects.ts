import { getDb } from "../client";
import type { Project } from "../types";

export async function listProjects() {
	const db = await getDb();
	return db
		.collection<Project>("projects")
		.find({})
		.sort({ date: -1 })
		.toArray();
}

export async function getProjectBySlug(slug: string) {
	const db = await getDb();
	return db.collection<Project>("projects").findOne({ slug });
}

export async function upsertProject(
	slug: string,
	data: Omit<Project, "_id" | "slug">,
) {
	const db = await getDb();
	return db
		.collection<Project>("projects")
		.findOneAndUpdate(
			{ slug },
			{ $set: data, $setOnInsert: { slug } },
			{ upsert: true, returnDocument: "after" },
		);
}

export async function deleteProject(slug: string) {
	const db = await getDb();
	return db.collection<Project>("projects").deleteOne({ slug });
}

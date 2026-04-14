import type { APIRoute } from "astro";
import {
	deletePost,
	getPostBySlug,
	upsertPost,
} from "../../../lib/db/repos/posts";
import { isValidSlug, verifyToken } from "../../../lib/security";

export const prerender = false;

function parseDate(value: string): Date {
	const mmddyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (mmddyyyy) {
		const [, mm, dd, yyyy] = mmddyyyy;
		return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
	}
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? new Date() : d;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	const cookie = cookies.get("admin_token");
	if (!verifyToken(cookie?.value, import.meta.env.ADMIN_TOKEN)) {
		return new Response("Unauthorized", { status: 401 });
	}

	const form = await request.formData();

	const originalSlug = form.get("original_slug")?.toString().trim() ?? "";
	const slug = form.get("slug")?.toString().trim() || "untitled";
	const title = form.get("title")?.toString().trim() ?? "";
	const description = form.get("description")?.toString().trim() ?? "";
	const tagsRaw = form.get("tags")?.toString() ?? "";
	const draft = form.get("draft") === "on";
	const createdAtRaw = form.get("created_at")?.toString().trim() ?? "";
	const body = form.get("body")?.toString() ?? "";
	const image = form.get("image_path")?.toString().trim() || null;

	if (!isValidSlug(slug)) {
		return new Response("Invalid slug", { status: 400 });
	}
	if (originalSlug && !isValidSlug(originalSlug)) {
		return new Response("Invalid original slug", { status: 400 });
	}

	const tags = tagsRaw
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);

	const createdAt = createdAtRaw ? parseDate(createdAtRaw) : new Date();

	try {
		const existing = await getPostBySlug(originalSlug || slug);
		await upsertPost(slug, {
			title,
			description,
			body,
			tags,
			image,
			draft,
			createdAt: existing?.createdAt ?? createdAt,
			updatedAt: null,
		});

		if (originalSlug && originalSlug !== slug) {
			await deletePost(originalSlug);
		}
	} catch (err) {
		console.error("Failed to save post:", err);
		return redirect(
			`${base}/admin/editor?slug=${encodeURIComponent(slug)}&error=save_failed`,
		);
	}

	return redirect(`${base}/admin/dashboard?saved=1`);
};

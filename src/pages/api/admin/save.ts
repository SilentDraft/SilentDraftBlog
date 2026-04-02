import { existsSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { APIRoute } from "astro";
import { isValidSlug, safePath, verifyToken } from "../../../lib/security";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const cookie = cookies.get("admin_token");
	if (!verifyToken(cookie?.value, import.meta.env.ADMIN_TOKEN)) {
		return new Response("Unauthorized", { status: 401 });
	}

	const form = await request.formData();

	const originalSlug = form.get("original_slug")?.toString().trim() ?? "";
	const slug = form.get("slug")?.toString().trim() || "untitled";
	const ext = form.get("ext")?.toString() === "mdx" ? "mdx" : "md";
	const title = form.get("title")?.toString().trim() ?? "";
	const description = form.get("description")?.toString().trim() ?? "";
	const tagsRaw = form.get("tags")?.toString() ?? "";
	const draft = form.get("draft") === "on";
	const createdAt =
		form.get("created_at")?.toString().trim() ||
		(() => {
			const n = new Date();
			return `${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}-${n.getFullYear()}`;
		})();
	const body = form.get("body")?.toString() ?? "";

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

	const tagsYaml =
		tags.length > 0
			? `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}`
			: "tags: []";

	const frontmatterLines = [
		`title: "${title.replace(/"/g, '\\"')}"`,
		`description: "${description.replace(/"/g, '\\"')}"`,
		`createdAt: ${createdAt}`,
		`draft: ${draft}`,
		tagsYaml,
	].join("\n");

	const content = `---\n${frontmatterLines}\n---\n\n${body}`;

	const postsDir = join(process.cwd(), "src", "content", "posts");
	const newPath = safePath(postsDir, `${slug}.${ext}`);
	if (!newPath) {
		return new Response("Invalid file path", { status: 400 });
	}

	try {
		await writeFile(newPath, content, "utf-8");

		if (originalSlug && originalSlug !== slug) {
			for (const oldExt of ["md", "mdx"]) {
				const oldPath = safePath(postsDir, `${originalSlug}.${oldExt}`);
				if (oldPath && existsSync(oldPath) && oldPath !== newPath) {
					await unlink(oldPath);
				}
			}
		}
	} catch (err) {
		console.error("Failed to save post:", err);
		return redirect(
			`/admin/editor?slug=${encodeURIComponent(slug)}&ext=${ext}&error=save_failed`,
		);
	}

	return redirect(
		`/admin/editor?slug=${encodeURIComponent(slug)}&ext=${ext}&saved=1`,
	);
};

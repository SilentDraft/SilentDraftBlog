import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { APIRoute } from "astro";
import { safePath, verifyToken } from "../../../lib/security";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const cookie = cookies.get("admin_token");
	if (!verifyToken(cookie?.value, import.meta.env.ADMIN_TOKEN)) {
		return new Response("Unauthorized", { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!file || !(file instanceof File) || file.size === 0) {
		return redirect("/admin/dashboard?error=empty");
	}

	const filename = file.name;
	if (!filename.endsWith(".md") && !filename.endsWith(".mdx")) {
		return redirect("/admin/dashboard?error=type");
	}

	const postsDir = join(process.cwd(), "src", "content", "posts");
	const targetPath = safePath(postsDir, filename);
	if (!targetPath) {
		return new Response("Invalid filename", { status: 400 });
	}

	const content = await file.text();

	try {
		await writeFile(targetPath, content, "utf-8");
	} catch {
		return redirect("/admin/dashboard?error=write");
	}

	return redirect(
		`/admin/dashboard?success=1&file=${encodeURIComponent(filename)}`,
	);
};

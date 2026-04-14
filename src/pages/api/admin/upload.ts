import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { APIRoute } from "astro";
import { insertImage } from "../../../lib/db/repos/misc";
import { verifyToken } from "../../../lib/security";

export const prerender = false;

const ALLOWED = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".svg",
	".avif",
]);
const MAX_SIZE = 10 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "uploads");

export const POST: APIRoute = async ({ request, cookies }) => {
	const cookie = cookies.get("admin_token");
	if (!verifyToken(cookie?.value, import.meta.env.ADMIN_TOKEN)) {
		return new Response("Unauthorized", { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!file || !(file instanceof File) || file.size === 0) {
		return new Response(JSON.stringify({ error: "empty" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}
	if (file.size > MAX_SIZE) {
		return new Response(JSON.stringify({ error: "too_large" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}

	const ext = extname(file.name).toLowerCase();
	if (!ALLOWED.has(ext)) {
		return new Response(JSON.stringify({ error: "unsupported_type" }), {
			status: 400,
			headers: { "content-type": "application/json" },
		});
	}

	const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
	await mkdir(UPLOAD_DIR, { recursive: true });
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(join(UPLOAD_DIR, safeName), buffer);

	const url = `/uploads/${safeName}`;
	await insertImage({
		filename: safeName,
		url,
		size: file.size,
		mimeType: file.type || "application/octet-stream",
		uploadedAt: new Date(),
	});

	return new Response(JSON.stringify({ url, filename: safeName }), {
		status: 200,
		headers: { "content-type": "application/json" },
	});
};

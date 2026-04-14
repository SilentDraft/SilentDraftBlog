import type { APIRoute } from "astro";
import { renderMarkdown } from "../../../lib/markdown";
import { verifyToken } from "../../../lib/security";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	const cookie = cookies.get("admin_token");
	if (!verifyToken(cookie?.value, import.meta.env.ADMIN_TOKEN)) {
		return new Response("Unauthorized", { status: 401 });
	}

	const body = await request.text();
	const html = await renderMarkdown(body);

	return new Response(html, {
		headers: { "content-type": "text/html; charset=utf-8" },
	});
};

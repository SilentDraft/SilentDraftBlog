import { exec } from "node:child_process";
import type { APIRoute } from "astro";
import { verifyToken } from "../../../lib/security";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	const cookie = cookies.get("admin_token");
	if (!verifyToken(cookie?.value, import.meta.env.ADMIN_TOKEN)) {
		return new Response("Unauthorized", { status: 401 });
	}

	exec(
		"pnpm build --ignore-scripts && pm2 restart silentdraft-blog",
		{ cwd: import.meta.env.PROJECT_DIR },
	);

	return new Response(JSON.stringify({ ok: true }), {
		headers: { "Content-Type": "application/json" },
	});
};

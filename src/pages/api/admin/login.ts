import type { APIRoute } from "astro";
import { checkRateLimit, verifyToken } from "../../../lib/security";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	const clientIp =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown";

	if (!checkRateLimit(clientIp)) {
		return new Response("Too many login attempts. Try again later.", {
			status: 429,
		});
	}

	const formData = await request.formData();
	const inputToken = formData.get("token")?.toString();
	const adminToken = import.meta.env.ADMIN_TOKEN;

	if (!adminToken) {
		return new Response("ADMIN_TOKEN이 설정되지 않았습니다.", { status: 500 });
	}

	if (verifyToken(inputToken, adminToken)) {
		cookies.set("admin_token", adminToken, {
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: "strict",
			path: "/",
			maxAge: 60 * 60 * 24,
		});
		return redirect(`${base}/admin/dashboard`);
	}

	return redirect(`${base}/admin?error=invalid`);
};

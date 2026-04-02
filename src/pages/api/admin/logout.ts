import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	cookies.delete("admin_token", { path: "/" });
	return redirect(`${base}/admin`);
};

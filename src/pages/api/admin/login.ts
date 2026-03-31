import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const inputToken = formData.get("token")?.toString();
  const adminToken = import.meta.env.ADMIN_TOKEN;

  if (!adminToken) {
    return new Response("ADMIN_TOKEN이 설정되지 않았습니다.", { status: 500 });
  }

  if (inputToken === adminToken) {
    cookies.set("admin_token", adminToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24시간
    });
    return redirect("/admin/dashboard");
  }

  return redirect("/admin?error=invalid");
};

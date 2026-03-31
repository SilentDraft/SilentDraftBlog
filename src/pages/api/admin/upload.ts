import type { APIRoute } from "astro";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // 인증 확인
  const cookie = cookies.get("admin_token");
  if (!cookie?.value || cookie.value !== import.meta.env.ADMIN_TOKEN) {
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

  const content = await file.text();
  const targetPath = join(process.cwd(), "src", "content", "posts", filename);

  try {
    await writeFile(targetPath, content, "utf-8");
  } catch {
    return redirect("/admin/dashboard?error=write");
  }

  return redirect(`/admin/dashboard?success=1&file=${encodeURIComponent(filename)}`);
};

import type { APIRoute } from "astro";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookie = cookies.get("admin_token");
  if (!cookie?.value || cookie.value !== import.meta.env.ADMIN_TOKEN) {
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
  const createdAt = form.get("created_at")?.toString().trim() || (() => {
    const n = new Date();
    return `${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}-${n.getFullYear()}`;
  })();
  const body = form.get("body")?.toString() ?? "";

  // Build tags YAML
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const tagsYaml =
    tags.length > 0
      ? `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}`
      : "tags: []";

  // Build frontmatter
  const frontmatterLines = [
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `createdAt: ${createdAt}`,
    `draft: ${draft}`,
    tagsYaml,
  ].join("\n");

  const content = `---\n${frontmatterLines}\n---\n\n${body}`;

  const postsDir = join(process.cwd(), "src", "content", "posts");
  const newFilename = `${slug}.${ext}`;
  const newPath = join(postsDir, newFilename);

  try {
    await writeFile(newPath, content, "utf-8");

    // If slug changed, delete old file
    if (originalSlug && originalSlug !== slug) {
      for (const oldExt of ["md", "mdx"]) {
        const oldPath = join(postsDir, `${originalSlug}.${oldExt}`);
        if (existsSync(oldPath) && oldPath !== newPath) {
          await unlink(oldPath);
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return redirect(`/admin/editor?slug=${encodeURIComponent(slug)}&ext=${ext}&error=${encodeURIComponent(msg)}`);
  }

  return redirect(`/admin/editor?slug=${encodeURIComponent(slug)}&ext=${ext}&saved=1`);
};

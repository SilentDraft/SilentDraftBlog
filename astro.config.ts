import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import spectre from "./package/src";
import { spectreDark } from "./src/ec-theme";

// ── GitHub-style alert 렌더링 플러그인 ──
// > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION] 문법 지원
function rehypeGithubAlerts() {
  const ALERTS: Record<string, { cls: string; icon: string; label: string }> = {
    NOTE: { cls: "note", icon: "ℹ", label: "Note" },
    TIP: { cls: "tip", icon: "💡", label: "Tip" },
    IMPORTANT: { cls: "important", icon: "❗", label: "Important" },
    WARNING: { cls: "warning", icon: "⚠", label: "Warning" },
    CAUTION: { cls: "caution", icon: "🚨", label: "Caution" },
  };

  function walk(node: any, parent: any, index: number) {
    if (node.type === "element" && node.tagName === "blockquote") {
      const firstParaIdx: number =
        node.children?.findIndex(
          (c: any) => c.type === "element" && c.tagName === "p",
        ) ?? -1;

      if (firstParaIdx !== -1) {
        const firstPara = node.children[firstParaIdx];
        const textNode = firstPara.children?.find(
          (c: any) => c.type === "text",
        );

        if (textNode) {
          const match = String(textNode.value).match(
            /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?/i,
          );
          if (match) {
            const cfg = ALERTS[match[1].toUpperCase()];

            // [!TYPE] 접두사 제거
            textNode.value = textNode.value.replace(
              /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?/i,
              "",
            );

            // 첫 단락이 비었으면 제거
            let body = node.children.filter(
              (c: any) => !(c.type === "text" && !c.value.trim()),
            );
            if (!textNode.value.trim() && firstPara.children.length === 1) {
              body = body.filter((c: any) => c !== firstPara);
            }

            parent.children[index] = {
              type: "element",
              tagName: "div",
              properties: { className: ["gh-alert", `gh-alert-${cfg.cls}`] },
              children: [
                {
                  type: "element",
                  tagName: "div",
                  properties: { className: ["gh-alert-title"] },
                  children: [
                    { type: "text", value: `${cfg.icon} ${cfg.label}` },
                  ],
                },
                ...body,
              ],
            };
            return;
          }
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        walk(node.children[i], node, i);
      }
    }
  }

  return (tree: any) => {
    if (Array.isArray(tree.children)) {
      for (let i = tree.children.length - 1; i >= 0; i--) {
        walk(tree.children[i], tree, i);
      }
    }
  };
}

// https://astro.build/config
const config = defineConfig({
  site: "https://silentdraft.dev/blog",
  output: "server",
  markdown: {
    rehypePlugins: [rehypeGithubAlerts],
  },
  integrations: [
    expressiveCode({
      themes: [spectreDark],
    }),
    mdx(),
    sitemap(),
    spectre({
      name: "SilentDraft",
      openGraph: {
        home: {
          title: "SilentDraft",
          description: "SilentDraft의 개발 블로그",
        },
        blog: {
          title: "Blog",
          description: "개발 관련 글과 가이드",
        },
        projects: {
          title: "Projects",
        },
      },
    }),
  ],
  adapter: node({
    mode: "standalone",
  }),
});

export default config;

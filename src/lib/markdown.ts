import Shiki from "@shikijs/markdown-it";
import MarkdownIt from "markdown-it";
import githubAlerts from "markdown-it-github-alerts";

let mdPromise: Promise<MarkdownIt> | null = null;

async function buildRenderer(): Promise<MarkdownIt> {
	const md = new MarkdownIt({
		html: true,
		linkify: true,
		typographer: false,
		breaks: false,
	});
	md.use(
		await Shiki({
			themes: {
				light: "github-dark",
				dark: "github-dark",
			},
		}),
	);
	md.use(githubAlerts);
	return md;
}

export async function renderMarkdown(source: string): Promise<string> {
	if (!mdPromise) mdPromise = buildRenderer();
	const md = await mdPromise;
	return md.render(source);
}

export type Heading = { depth: number; slug: string; text: string };

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s가-힣-]/g, "")
		.replace(/\s+/g, "-");
}

export function extractHeadings(source: string): Heading[] {
	const lines = source.split("\n");
	const out: Heading[] = [];
	let inCode = false;
	for (const line of lines) {
		if (/^```/.test(line)) {
			inCode = !inCode;
			continue;
		}
		if (inCode) continue;
		const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
		if (!match) continue;
		const depth = match[1].length;
		const text = match[2];
		out.push({ depth, slug: slugify(text), text });
	}
	return out;
}

export async function renderMarkdownWithHeadings(
	source: string,
): Promise<{ html: string; headings: Heading[] }> {
	const [html, headings] = [
		await renderMarkdown(source),
		extractHeadings(source),
	];
	return { html, headings };
}

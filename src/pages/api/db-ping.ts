import type { APIRoute } from "astro";
import { getDb } from "../../lib/db/client";

export const GET: APIRoute = async () => {
	try {
		const db = await getDb();
		const result = await db.command({ ping: 1 });
		const collections = (await db.listCollections().toArray()).map(
			(c) => c.name,
		);
		return new Response(
			JSON.stringify({ ok: true, ping: result, collections }, null, 2),
			{ headers: { "content-type": "application/json" } },
		);
	} catch (err) {
		return new Response(
			JSON.stringify({ ok: false, error: (err as Error).message }),
			{ status: 500, headers: { "content-type": "application/json" } },
		);
	}
};

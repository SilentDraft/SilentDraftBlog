import { timingSafeEqual } from "node:crypto";
import { basename, resolve } from "node:path";

const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,200}$/;

/**
 * Validate that a slug contains only safe characters (alphanumeric, hyphens, underscores).
 */
export function isValidSlug(slug: string): boolean {
	return SLUG_PATTERN.test(slug);
}

/**
 * Resolve a filename within a base directory and verify it does not escape.
 * Returns the resolved path if safe, or null if a traversal attempt is detected.
 */
export function safePath(baseDir: string, filename: string): string | null {
	const safe = basename(filename);
	const resolved = resolve(baseDir, safe);
	if (!resolved.startsWith(resolve(baseDir))) {
		return null;
	}
	return resolved;
}

/**
 * Constant-time token comparison to prevent timing attacks.
 */
export function verifyToken(
	input: string | undefined | null,
	expected: string,
): boolean {
	if (!input || !expected) return false;
	const inputBuf = Buffer.from(input, "utf-8");
	const expectedBuf = Buffer.from(expected, "utf-8");
	if (inputBuf.length !== expectedBuf.length) return false;
	return timingSafeEqual(inputBuf, expectedBuf);
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an IP is rate-limited for login attempts.
 * Returns true if the request should be allowed, false if rate-limited.
 */
export function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const entry = loginAttempts.get(ip);

	if (!entry || now > entry.resetAt) {
		loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
		return true;
	}

	if (entry.count >= MAX_ATTEMPTS) {
		return false;
	}

	entry.count++;
	return true;
}

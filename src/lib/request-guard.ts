type RateBucket = {
  count: number;
  resetAt: number;
};

export { isValidEmail, isValidUkrainianPhone } from "@/lib/validation";

const buckets = new Map<string, RateBucket>();

const MAX_BUCKETS = 10_000;

/**
 * Client IP for rate limiting and lead records. X-Real-IP comes first: nginx
 * overwrites it with $remote_addr (the real visitor once the realip module
 * trusts Cloudflare), so a client can't spoof it the way it can send its own
 * CF-Connecting-IP or X-Forwarded-For when hitting the server directly.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function checkRateLimit(
  request: Request | Headers,
  scope: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const key = `${scope}:${clientIp(request instanceof Headers ? request : request.headers)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: Math.ceil(windowMs / 1000) };
  }

  current.count += 1;
  if (buckets.size > 5_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    // Still too many live buckets (a flood of distinct IPs): drop the oldest
    // so memory stays bounded.
    for (const bucketKey of buckets.keys()) {
      if (buckets.size <= MAX_BUCKETS) break;
      buckets.delete(bucketKey);
    }
  }

  return {
    allowed: current.count <= limit,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function requestBodyTooLarge(request: Request, maxBytes = 32_768): boolean {
  const value = Number(request.headers.get("content-length"));
  return Number.isFinite(value) && value > maxBytes;
}

export function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

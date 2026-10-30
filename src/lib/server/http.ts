import { NextResponse } from "next/server";
import type { z } from "zod";

const buckets = new Map<string, { count: number; until: number }>();
export function guard(request: Request, category: string, limit = 30): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin) {
    let sameHost = false;
    try { sameHost = new URL(origin).host === (request.headers.get("host") || new URL(request.url).host); } catch {}
    if (!sameHost) return NextResponse.json({ error: "Please use this app’s own page." }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${category}:${ip}`; const now = Date.now();
  if (buckets.size > 10000) for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  let bucket = buckets.get(key);
  if (!bucket || bucket.until < now) { bucket = { count: 0, until: now + 60000 }; buckets.set(key, bucket); }
  bucket.count++;
  if (bucket.count > limit) return NextResponse.json({ error: "A little breather — please try again in a minute." }, { status: 429, headers: { "Retry-After": "60" } });
  return null;
}
export async function parseBody<T extends z.ZodType>(request: Request, schema: T, max = 32000): Promise<z.infer<T>> {
  if (Number(request.headers.get("content-length")) > max) throw new Error("Message is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("A request body is required.");
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > max) { await reader.cancel(); throw new Error("Message is too large."); } chunks.push(value); }
    const buffer = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
    return schema.parse(JSON.parse(new TextDecoder().decode(buffer)));
  } finally { reader.releaseLock(); }
}
export function invalidRequest() { return NextResponse.json({ error: "Please check the information you sent and try again." }, { status: 400 }); }

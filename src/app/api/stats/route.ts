import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.ANALYTICS_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!secret || Buffer.byteLength(provided) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(); if (!db) return NextResponse.json({ enabled: false, message: "Configure DATABASE_URL and run migrations." });
  try {
    const since = new Date(Date.now() - 7 * 86400000);
    const [visitors, assessments, activeLast7Days, recentAssessments, byArchetype, byStatus] = await Promise.all([
      db.visitor.count(), db.assessment.count(), db.visitor.count({ where: { lastSeen: { gte: since } } }), db.assessment.count({ where: { createdAt: { gte: since } } }),
      db.assessment.groupBy({ by: ["primary"], _count: { _all: true } }), db.assessment.groupBy({ by: ["status"], _count: { _all: true } })
    ]);
    return NextResponse.json({ enabled: true, visitors, assessments, activeLast7Days, recentAssessments, byArchetype, byStatus, counting: "Unique anonymous browsers; retakes count as separate assessments." }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Database unavailable." }, { status: 503 }); }
}

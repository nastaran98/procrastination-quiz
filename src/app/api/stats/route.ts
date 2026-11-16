import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { archetypes } from "@/data/archetypes";
import { workbookFiles } from "@/data/workbooks";
import { archetypeIds } from "@/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.ANALYTICS_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!secret || Buffer.byteLength(provided) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb(); if (!db) return NextResponse.json({ enabled: false, message: "Configure DATABASE_URL and run migrations." });
  try {
    const since = new Date(Date.now() - 7 * 86400000);
    const [visitors, assessments, activeLast7Days, recentAssessments, byArchetype, byStatus, downloads, recentDownloads, downloadsByArchetype] = await Promise.all([
      db.visitor.count(), db.assessment.count(), db.visitor.count({ where: { lastSeen: { gte: since } } }), db.assessment.count({ where: { createdAt: { gte: since } } }),
      db.assessment.groupBy({ by: ["primary"], _count: { _all: true } }), db.assessment.groupBy({ by: ["status"], _count: { _all: true } }),
      db.workbookDownload.count(), db.workbookDownload.count({ where: { createdAt: { gte: since } } }),
      db.workbookDownload.groupBy({ by: ["archetypeId"], _count: { _all: true } })
    ]);
    const workbookDownloads = {
      total: downloads,
      last7Days: recentDownloads,
      byWorkbook: archetypeIds.map(id => ({ archetypeId: id, name: archetypes[id].name, fileName: workbookFiles[id], downloads: downloadsByArchetype.find(row => row.archetypeId === id)?._count._all ?? 0 })),
      counting: "Download requests through the workbook endpoint, not unique people or confirmed saves. Repeat requests count again; direct public PDF links are not tracked.",
    };
    return NextResponse.json({ enabled: true, visitors, assessments, activeLast7Days, recentAssessments, byArchetype, byStatus, workbookDownloads, counting: "Unique anonymous browsers; retakes count as separate assessments." }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Database unavailable." }, { status: 503 }); }
}

import { z } from "zod";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { guard, invalidRequest, parseBody } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const blocked = guard(request, "usage", 90); if (blocked) return blocked;
  let data; try { data = await parseBody(request, z.object({ visitorId: z.uuid() }), 1000); } catch { return invalidRequest(); }
  const db = getDb(); if (!db) return NextResponse.json({ enabled: false });
  try {
    await db.visitor.upsert({ where: { id: data.visitorId }, create: { id: data.visitorId }, update: { lastSeen: new Date() } });
    return NextResponse.json({ enabled: true, recorded: true });
  } catch { console.error("Visitor recording failed. Check database connectivity and migrations."); return NextResponse.json({ error: "Usage recording unavailable." }, { status: 503 }); }
}

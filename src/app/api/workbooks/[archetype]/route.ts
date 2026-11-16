import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { archetypes } from "@/data/archetypes";
import { workbookFiles } from "@/data/workbooks";
import { getDb } from "@/lib/server/db";
import { archetypeIdSchema } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ archetype: string }> };
const noCache = { "Cache-Control": "private, no-store" };

async function download(context: Context, headOnly: boolean) {
  const parsed = archetypeIdSchema.safeParse((await context.params).archetype);
  if (!parsed.success) return NextResponse.json({ error: "Workbook not found." }, { status: 404, headers: noCache });

  const id = parsed.data;
  const fileName = workbookFiles[id];
  const filePath = path.join(process.cwd(), "public", "solutions", fileName);
  let body: Uint8Array<ArrayBuffer> | null = null;
  let size: number;
  try {
    if (headOnly) size = (await stat(filePath)).size;
    else { body = new Uint8Array(await readFile(filePath)); size = body.byteLength; }
  } catch {
    console.error("Workbook file unavailable:", fileName);
    return NextResponse.json({ error: "Workbook file unavailable." }, { status: 503, headers: noCache });
  }

  let tracking = "disabled";
  if (!headOnly) {
    try {
      const db = getDb();
      if (db) {
        await db.workbookDownload.create({ data: { archetypeId: id, fileName } });
        tracking = "recorded";
      }
    } catch {
      tracking = "unavailable";
      console.error("Workbook download recording failed. Check database connectivity and migrations.");
    }
  }

  return new Response(body, { headers: {
    ...noCache,
    "Content-Type": "application/pdf",
    "Content-Length": String(size),
    "Content-Disposition": `attachment; filename="${archetypes[id].name} - Workbook.pdf"`,
    "X-Workbook-Tracking": headOnly ? "not-counted" : tracking,
  } });
}

export async function GET(_request: Request, context: Context) { return download(context, false); }
export async function HEAD(_request: Request, context: Context) { return download(context, true); }

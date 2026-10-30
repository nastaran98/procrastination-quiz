import { z } from "zod";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { guard, invalidRequest, parseBody } from "@/lib/server/http";
import { demographicsSchema, emailSchema, followUpSchema, quizAnswerSchema } from "@/types";
import { scoreQuiz } from "@/lib/archetypes/scoring";
import { nextFollowUp } from "@/lib/archetypes/follow-ups";
const schema = z.object({ visitorId: z.uuid(), sessionId: z.uuid(), email: emailSchema, demographics: demographicsSchema, answers: z.array(quizAnswerSchema).length(10), followUps: z.array(followUpSchema).max(2) });
export const runtime = "nodejs";
export async function POST(request: Request) {
  const blocked = guard(request, "results", 30); if (blocked) return blocked;
  let data, result;
  try {
    data = await parseBody(request, schema);
    for (let i = 0; i < data.followUps.length; i++) {
      const expected = nextFollowUp(scoreQuiz(data.answers, data.followUps.slice(0, i)), i);
      const actual = data.followUps[i];
      if (!expected || expected.a !== actual.a || expected.b !== actual.b || expected.kind !== actual.kind) return invalidRequest();
    }
    result = scoreQuiz(data.answers, data.followUps);
  } catch { return invalidRequest(); }
  const db = getDb(); if (!db) return NextResponse.json({ enabled: false });
  try {
    const values = { email: data.email, age: data.demographics.age, sex: data.demographics.sex, status: result.status, primary: result.primary ?? null, secondary: result.secondary ?? null, completed: result.completed, scores: JSON.parse(JSON.stringify(result.scores)), answers: JSON.parse(JSON.stringify(data.answers)), followUps: JSON.parse(JSON.stringify(data.followUps)), followUpCount: data.followUps.length };
    await db.$transaction(async tx => {
      await tx.visitor.upsert({ where: { id: data.visitorId }, create: { id: data.visitorId }, update: { lastSeen: new Date() } });
      await tx.assessment.createMany({ data: [{ id: data.sessionId, visitorId: data.visitorId, ...values }], skipDuplicates: true });
      await tx.assessment.updateMany({ where: { id: data.sessionId, visitorId: data.visitorId, followUpCount: { lte: data.followUps.length } }, data: values });
    });
    return NextResponse.json({ enabled: true, recorded: true });
  } catch { console.error("Assessment recording failed. Check database connectivity and migrations."); return NextResponse.json({ error: "Result recording unavailable; your browser copy is safe." }, { status: 503 }); }
}

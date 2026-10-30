import { archetypes } from "@/data/archetypes";
import type { QuizResult } from "@/types";
export function nextFollowUp(result: QuizResult, count: number) {
  if (count >= 2 || !["mixed", "tentative"].includes(result.status)) return null;
  const [a, b] = result.scores;
  return { a: a.id, b: b.id, kind: count === 0 ? "blocker" as const : "strategy" as const,
    question: count === 0 ? "Which feeling is more familiar when you put something off?" : "Which of these would make it easier for you to start?",
    textA: count === 0 ? archetypes[a.id].thought : archetypes[a.id].helpful,
    textB: count === 0 ? archetypes[b.id].thought : archetypes[b.id].helpful
  };
}

import { archetypeIds, type AdaptiveFollowUp, type ArchetypeScore, type QuizAnswer, type QuizResult } from "@/types";
import { questions } from "@/data/questions";

export function validateAnswers(answers: QuizAnswer[]) {
  const seen = new Set<number>();
  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question || seen.has(answer.questionId)) throw new Error("Invalid or duplicate question.");
    seen.add(answer.questionId);
    if ((answer.none || answer.skipped) && (answer.primary || answer.secondary) || answer.none && answer.skipped) throw new Error("Exclusive choices cannot be combined.");
    if (!answer.none && !answer.skipped && !answer.primary) throw new Error("Choose a primary answer first.");
    if (answer.primary && answer.primary === answer.secondary) throw new Error("Selections must be different.");
    for (const selection of [answer.primary, answer.secondary]) {
      if (selection && !question.options.some(o => o.archetype === selection)) throw new Error("Answer is not available in this question.");
    }
  }
}

export function scoreQuiz(answers: QuizAnswer[], followUps: AdaptiveFollowUp[] = []): QuizResult {
  validateAnswers(answers);
  if (followUps.length > 2) throw new Error("At most two follow-ups are allowed.");
  const scores: ArchetypeScore[] = archetypeIds.map(id => ({ id, points: 0, opportunities: 0, primary: 0, secondary: 0, selections: 0, fitScore: 0 }));
  const byId = Object.fromEntries(scores.map(s => [s.id, s])) as Record<typeof archetypeIds[number], ArchetypeScore>;
  let completed = 0, noneCount = 0;
  for (const answer of answers) {
    if (answer.skipped) continue;
    completed++;
    if (answer.none) noneCount++;
    for (const option of questions[answer.questionId - 1].options) byId[option.archetype].opportunities++;
    if (answer.primary) { const s = byId[answer.primary]; s.points += 2; s.primary++; s.selections++; }
    if (answer.secondary) { const s = byId[answer.secondary]; s.points++; s.secondary++; s.selections++; }
  }
  for (const follow of followUps) {
    if (follow.a === follow.b || !byId[follow.a] || !byId[follow.b]) throw new Error("Follow-up must compare different valid patterns.");
    for (const side of ["a", "b"] as const) {
      const s = byId[follow[side]]; s.opportunities++;
      if (follow.choice === side) { s.points += 2; s.primary++; s.selections++; }
      else if (follow.choice === "both") { s.points++; s.secondary++; s.selections++; }
    }
  }
  for (const s of scores) s.fitScore = s.opportunities ? s.points / (2 * s.opportunities) : 0;
  scores.sort((a, b) => b.fitScore - a.fitScore || b.primary - a.primary || b.points - a.points || archetypeIds.indexOf(a.id) - archetypeIds.indexOf(b.id));
  const [top, runner] = scores;
  const gap = top.fitScore - runner.fitScore;
  let status: QuizResult["status"];
  if (completed < 8 || noneCount >= 4 || top.fitScore < .35 || top.selections < 2) status = "insufficient";
  else if (gap < .15 - 1e-10) status = "mixed";
  else if (top.fitScore >= .5 && top.selections >= 3 && top.primary >= 2) status = "clear";
  else status = "tentative";
  return { status, scores, completed, noneCount,
    primary: status === "insufficient" ? undefined : top.id,
    secondary: status !== "insufficient" && runner.fitScore >= .3 && runner.fitScore >= .65 * top.fitScore && runner.selections >= 2 ? runner.id : undefined
  };
}

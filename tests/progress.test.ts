import { describe, expect, it } from "vitest";
import { newProfile, newQuiz, restoreProfile } from "@/lib/storage";
import { awardCompletion, getAchievements, getLevel } from "@/lib/gamification/xp";
import { newExercise, resumePractice, timerRemaining } from "@/lib/games";
import { clearAnswers } from "./fixtures";
import { scoreQuiz } from "@/lib/archetypes/scoring";
describe("persistent progress", () => {
  it("round trips the quiz answer order, answers, index and followups", () => { const profile = newProfile(); profile.quiz = { ...newQuiz(), started: true, index: 4, answers: clearAnswers.slice(0, 4) }; expect(restoreProfile(JSON.stringify(profile))).toEqual(profile); });
  it("safely rejects corrupted JSON, invalid schema and invalid orders", () => { expect(restoreProfile("oops")).toBeNull(); expect(restoreProfile('{"version":2}')).toBeNull(); const p = newProfile(); p.quiz = newQuiz(); p.quiz.orders[0] = Array(6).fill("perfectionist"); expect(restoreProfile(JSON.stringify(p))).toBeNull(); });
  it("rejects syntactically valid but impossible persisted quiz answers", () => { const p = newProfile(); p.quiz = newQuiz(); p.quiz.answers = [{ questionId: 1, primary: "overdoer" }]; expect(restoreProfile(JSON.stringify(p))).toBeNull(); });
  it("makes a new independent quiz session when retaking", () => { expect(newQuiz().id).not.toBe(newQuiz().id); expect(newQuiz().answers).toEqual([]); });
  it("restores email, demographics, every answer, and a recalculated final result", () => {
    const profile = newProfile();
    profile.quiz = { ...newQuiz(), email: "quiz@example.com", demographics: { age: 28, sex: "female" }, started: true, finished: true, answers: clearAnswers, result: { ...scoreQuiz(clearAnswers), primary: "dreamer" } };
    const restored = restoreProfile(JSON.stringify(profile))!;
    expect(restored.quiz?.demographics).toEqual({ age: 28, sex: "female" });
    expect(restored.quiz?.email).toBe("quiz@example.com");
    expect(restored.quiz?.answers).toEqual(clearAnswers);
    expect(restored.quiz?.result).toEqual(scoreQuiz(clearAnswers));
  });
});
describe("legitimate, idempotent rewards", () => {
  it("awards a win once even after refresh or a repeated click", () => { const s = { ...newExercise("celebrate-wins"), task: "Wrote one sentence", stage: "done" as const }; const events = awardCompletion([], s); expect(events).toHaveLength(1); expect(events[0].amount).toBe(10); expect(awardCompletion(events, s)).toBe(events); expect(awardCompletion(JSON.parse(JSON.stringify(events)), s)).toHaveLength(1); });
  it("does not award XP for opening a game or a blank achievement", () => { expect(awardCompletion([], newExercise("celebrate-wins"))).toEqual([]); expect(awardCompletion([], { ...newExercise("celebrate-wins"), stage: "done" })).toEqual([]); });
  it("requires an explicit action reflection after a timer", () => { const s = { ...newExercise("start-before-ready"), task: "Write", stage: "done" as const, remaining: 0 }; expect(awardCompletion([], s)).toEqual([]); expect(awardCompletion([], { ...s, reflection: "Wrote a rough line" })[0]).toMatchObject({ amount: 20, focusMinutes: 2 }); });
  it("requires all good-enough criteria", () => { const s = { ...newExercise("good-enough"), task: "Email", stage: "done" as const, criteria: ["Clear", "Complete"], checked: [true, false] }; expect(awardCompletion([], s)).toEqual([]); expect(awardCompletion([], { ...s, checked: [true, true] })[0].amount).toBe(25); });
  it("requires a selected mission action", () => { const s = { ...newExercise("realistic-goals"), task: "Portfolio", stage: "done" as const }; expect(awardCompletion([], s)).toEqual([]); expect(awardCompletion([], { ...s, steps: ["Pick one project"] })[0].amount).toBe(20); });
  it("calculates configurable levels and badges from real events", () => { const events = Array.from({ length: 5 }, () => awardCompletion([], { ...newExercise("celebrate-wins"), task: "Tried", stage: "done" })[0]); expect(getLevel(events)).toMatchObject({ number: 2, xp: 50, name: "Momentum Maker" }); expect(getAchievements(events).filter(b => b.unlocked).map(b => b.id)).toEqual(["first", "wins"]); });
});
describe("timestamp-based focus timer", () => {
  it("remains correct after a hidden tab or reload", () => { const s = { ...newExercise("start-before-ready"), startedAt: 1000, remaining: 120000 }; expect(timerRemaining(s, 61000)).toBe(60000); expect(timerRemaining(JSON.parse(JSON.stringify(s)), 122000)).toBe(0); });
  it("does not run while paused", () => { const s = { ...newExercise("start-before-ready"), remaining: 34500, startedAt: null }; expect(timerRemaining(s, 99999999)).toBe(34500); });
  it("preserves previously elapsed focus time when extending a finished timer", () => { const s = resumePractice({ ...newExercise("start-before-ready"), task: "Draft", remaining: 0 }); const events = awardCompletion([], { ...s, stage: "done", remaining: 60000, reflection: "Wrote a rough paragraph" }); expect(events[0].focusMinutes).toBe(3); });
});

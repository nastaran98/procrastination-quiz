import type { ExerciseSession, GameId } from "@/types";
export function newExercise(game: GameId): ExerciseSession {
  return { id: crypto.randomUUID(), game, stage: "setup", task: "", criteria: ["", "", ""], checked: [false, false, false], duration: 120, remaining: 120000, startedAt: null, elapsedBeforeExtension: 0, reflection: "", steps: ["", "", ""], selected: 0, minutes: 5, createdAt: new Date().toISOString() };
}
export function timerRemaining(session: ExerciseSession, now: number): number {
  return Math.max(0, session.remaining - (session.startedAt === null ? 0 : Math.max(0, now - session.startedAt)));
}
export function resumePractice(session: ExerciseSession): ExerciseSession {
  return { ...session, stage: "active", startedAt: null, remaining: session.remaining || session.duration * 1000, elapsedBeforeExtension: session.remaining === 0 ? Math.min(86400000, session.elapsedBeforeExtension + session.duration * 1000) : session.elapsedBeforeExtension };
}

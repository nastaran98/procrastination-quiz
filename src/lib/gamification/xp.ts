import { exercises } from "@/data/exercises";
import type { Achievement, ExerciseSession, XPEvent } from "@/types";
export const levels = [ { xp: 0, name: "Tiny Starter" }, { xp: 50, name: "Momentum Maker" }, { xp: 120, name: "Brave Beginner" }, { xp: 250, name: "Progress Explorer" }, { xp: 500, name: "Good Enough Hero" } ];
export function getLevel(events: XPEvent[]) {
  const xp = events.reduce((sum, e) => sum + e.amount, 0);
  const index = levels.findLastIndex(l => xp >= l.xp);
  const next = levels[index + 1];
  return { xp, number: index + 1, name: levels[index].name, next: next?.xp, progress: next ? (xp - levels[index].xp) / (next.xp - levels[index].xp) : 1 };
}
export function awardCompletion(events: XPEvent[], session: ExerciseSession, now = new Date().toISOString()): XPEvent[] {
  if (events.some(e => e.id === session.id)) return events;
  if (session.stage !== "done" || !session.task.trim()) return events;
  if (session.game === "start-before-ready" && !session.reflection.trim()) return events;
  if (session.game === "good-enough" && (!session.criteria.length || session.criteria.some((c, i) => !c.trim() || !session.checked[i]))) return events;
  if (session.game === "realistic-goals" && !session.steps[session.selected]?.trim()) return events;
  const exercise = exercises.find(e => e.id === session.game)!;
  const elapsedMs = session.elapsedBeforeExtension + session.duration * 1000 - session.remaining;
  return [...events, { id: session.id, game: session.game, amount: exercise.xp, title: session.game === "start-before-ready" ? session.reflection.trim() : session.game === "realistic-goals" ? session.steps[session.selected].trim() : session.task.trim(), createdAt: now, focusMinutes: session.game === "start-before-ready" ? Math.max(0, Math.round(elapsedMs / 6000) / 10) : 0 }];
}
export function getAchievements(events: XPEvent[]): Achievement[] {
  return [
    { id: "first", name: "First Step", description: "Complete your first challenge", symbol: "🌱", unlocked: events.length > 0 },
    { id: "wins", name: "Tiny Win Collector", description: "Celebrate three little wins", symbol: "⭐", unlocked: events.filter(e => e.game === "celebrate-wins").length >= 3 },
    { id: "brave", name: "Brave Starter", description: "Make a messy start", symbol: "🚀", unlocked: events.some(e => e.game === "start-before-ready") },
    { id: "enough", name: "Good Enough Hero", description: "Finish a good-enough task", symbol: "🏅", unlocked: events.some(e => e.game === "good-enough") },
    { id: "builder", name: "Progress Builder", description: "Complete three tiny missions", symbol: "🏔️", unlocked: events.filter(e => e.game === "realistic-goals").length >= 3 }
  ];
}

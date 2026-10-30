import { questions } from "@/data/questions";
import { userProfileSchema, type QuizSession, type UserProfile } from "@/types";
import { scoreQuiz } from "@/lib/archetypes/scoring";
export const STORAGE_KEY = "procrastinot:profile:v1";
export const newProfile = (): UserProfile => ({ version: 1, visitorId: crypto.randomUUID(), quiz: null, events: [], wins: [], sessions: {}, completedSessions: [], chat: [] });
export function newQuiz(): QuizSession {
  return { id: crypto.randomUUID(), started: false, index: 0, orders: questions.map(q => {
    const ids = q.options.map(o => o.archetype);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids;
  }), answers: [], followUps: [], finished: false };
}
export function restoreProfile(raw: string | null): UserProfile | null {
  if (!raw) return null;
  try {
    const profile = userProfileSchema.parse(JSON.parse(raw));
    if (profile.quiz) {
      const result = scoreQuiz(profile.quiz.answers, profile.quiz.followUps);
      if (profile.quiz.finished) profile.quiz.result = result;
      profile.quiz.orders.forEach((order, i) => {
        if (new Set(order).size !== 6 || order.some(id => !questions[i].options.some(o => o.archetype === id))) throw new Error("Invalid order");
      });
    }
    return profile;
  } catch { return null; }
}

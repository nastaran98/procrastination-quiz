import { z } from "zod";

export const archetypeIds = ["perfectionist", "approval_seeker", "worrier", "self_doubter", "dreamer", "overwhelmed", "overdoer", "defier", "crisis_maker", "instant_gratification", "purpose_drifter", "shame_spiraler"] as const;
export const archetypeIdSchema = z.enum(archetypeIds);
export type ArchetypeId = z.infer<typeof archetypeIdSchema>;
export const gameIds = ["celebrate-wins", "start-before-ready", "good-enough", "realistic-goals"] as const;
export type GameId = typeof gameIds[number];
export interface Archetype {
  id: ArchetypeId; name: string; color: string; background: string; symbol: string;
  asset: string; description: string; rootCause: string; thought: string;
  symptoms: string[]; strategies: string[]; helpful: string; game: GameId;
}
export interface QuizQuestion { id: number; text: string; options: { archetype: ArchetypeId; text: string }[] }
export const quizAnswerSchema = z.object({ questionId: z.number().int().min(1).max(10), primary: archetypeIdSchema.optional(), secondary: archetypeIdSchema.optional(), none: z.boolean().optional(), skipped: z.boolean().optional() });
export type QuizAnswer = z.infer<typeof quizAnswerSchema>;
export const followUpSchema = z.object({ a: archetypeIdSchema, b: archetypeIdSchema, choice: z.enum(["a", "b", "both", "neither"]), kind: z.enum(["blocker", "strategy"]) });
export type AdaptiveFollowUp = z.infer<typeof followUpSchema>;
export const emailSchema = z.string().trim().max(254).email();
export const demographicsSchema = z.object({ age: z.number().int().min(1).max(120), sex: z.enum(["female", "male", "intersex", "prefer_not_to_say"]) });
export type Demographics = z.infer<typeof demographicsSchema>;
const quizResultSchema = z.object({ status: z.enum(["insufficient", "mixed", "clear", "tentative"]), scores: z.array(z.object({ id: archetypeIdSchema, points: z.number(), opportunities: z.number(), primary: z.number(), secondary: z.number(), selections: z.number(), fitScore: z.number() })), primary: archetypeIdSchema.optional(), secondary: archetypeIdSchema.optional(), completed: z.number(), noneCount: z.number() });
export const quizSessionSchema = z.object({ id: z.uuid(), email: emailSchema.optional(), demographics: demographicsSchema.optional(), result: quizResultSchema.optional(), started: z.boolean(), index: z.number().int().min(0).max(9), orders: z.array(z.array(archetypeIdSchema).length(6)).length(10), answers: z.array(quizAnswerSchema).max(10), followUps: z.array(followUpSchema).max(2), finished: z.boolean() });
export type QuizSession = z.infer<typeof quizSessionSchema>;
export interface ArchetypeScore { id: ArchetypeId; points: number; opportunities: number; primary: number; secondary: number; selections: number; fitScore: number }
export interface QuizResult { status: "insufficient" | "mixed" | "clear" | "tentative"; scores: ArchetypeScore[]; primary?: ArchetypeId; secondary?: ArchetypeId; completed: number; noneCount: number }
export const exerciseSessionSchema = z.object({
  id: z.uuid(), game: z.enum(gameIds), stage: z.enum(["setup", "active", "reflect", "done"]), task: z.string().max(500),
  criteria: z.array(z.string().max(200)).max(3), checked: z.array(z.boolean()).max(3),
  duration: z.number().min(60).max(1200), remaining: z.number().min(0).max(1200000), startedAt: z.number().nullable(), elapsedBeforeExtension: z.number().min(0).max(86400000).default(0),
  reflection: z.string().max(500), steps: z.array(z.string().max(200)).max(5), selected: z.number().int().min(0).max(4),
  minutes: z.union([z.literal(5), z.literal(10), z.literal(20)]), createdAt: z.string()
});
export type ExerciseSession = z.infer<typeof exerciseSessionSchema>;
export const smallWinSchema = z.object({ id: z.uuid(), text: z.string().min(1).max(500), createdAt: z.string() });
export type SmallWin = z.infer<typeof smallWinSchema>;
export interface Mission { id: string; goal: string; action: string; minutes: number; completed: boolean }
export const xpEventSchema = z.object({ id: z.uuid(), game: z.enum(gameIds), amount: z.number().int().min(0).max(25), title: z.string().max(500), createdAt: z.string(), focusMinutes: z.number().min(0).max(1460) });
export type XPEvent = z.infer<typeof xpEventSchema>;
export interface Achievement { id: string; name: string; description: string; symbol: string; unlocked: boolean }
export const chatMessageSchema = z.object({ id: z.uuid(), role: z.enum(["user", "assistant"]), content: z.string().max(3000), mode: z.enum(["guided", "live"]).optional(), game: z.enum(gameIds).optional() });
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export const userProfileSchema = z.object({ version: z.literal(1), visitorId: z.uuid(), quiz: quizSessionSchema.nullable(), events: z.array(xpEventSchema).max(10000), wins: z.array(smallWinSchema).max(10000), sessions: z.record(z.string(), exerciseSessionSchema), completedSessions: z.array(exerciseSessionSchema).max(10000).default([]), chat: z.array(chatMessageSchema).max(100) });
export type UserProfile = z.infer<typeof userProfileSchema>;

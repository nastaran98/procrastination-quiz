import type { ArchetypeId, QuizAnswer } from "@/types";
export const clearAnswers: QuizAnswer[] = (["perfectionist", "overdoer", "perfectionist", "self_doubter", "perfectionist", "dreamer", "perfectionist", "worrier", "perfectionist", "approval_seeker"] as ArchetypeId[]).map((primary, i) => ({ questionId: i + 1, primary }));
export const mixedAnswers: QuizAnswer[] = [
  { questionId: 1, primary: "perfectionist", secondary: "worrier" },
  { questionId: 2, primary: "overdoer" },
  { questionId: 3, primary: "worrier", secondary: "perfectionist" },
  { questionId: 4, primary: "self_doubter" },
  { questionId: 5, primary: "perfectionist" },
  { questionId: 6, primary: "worrier" },
  { questionId: 7, primary: "overwhelmed", secondary: "perfectionist" },
  { questionId: 8, primary: "defier", secondary: "worrier" },
  { questionId: 9, primary: "dreamer" },
  { questionId: 10, primary: "approval_seeker" }
];

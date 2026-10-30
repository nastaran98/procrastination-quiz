"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { newProfile, newQuiz, restoreProfile, STORAGE_KEY } from "@/lib/storage";
import { scoreQuiz } from "@/lib/archetypes/scoring";
import { awardCompletion } from "@/lib/gamification/xp";
import type { ExerciseSession, UserProfile } from "@/types";

interface AppContext { profile: UserProfile | null; ready: boolean; storageError: boolean; update: (fn: (p: UserProfile) => UserProfile) => void; retake: () => void; complete: (session: ExerciseSession) => void; reset: () => void; chatOpen: boolean; openChat: () => void; closeChat: () => void }
const Context = createContext<AppContext | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => {
    try { setProfile(restoreProfile(localStorage.getItem(STORAGE_KEY)) ?? newProfile()); }
    catch { setProfile(newProfile()); setStorageError(true); }
  }, []);
  useEffect(() => {
    if (!profile) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { setStorageError(true); }
  }, [profile]);
  const visitorId = profile?.visitorId;
  useEffect(() => {
    if (!visitorId) return;
    const report = () => { void fetch("/api/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId }) }).catch(() => {}); };
    report(); window.addEventListener("online", report);
    return () => window.removeEventListener("online", report);
  }, [visitorId]);
  const quiz = profile?.quiz;
  useEffect(() => {
    if (!visitorId || !quiz?.finished || !quiz.demographics || !quiz.email) return;
    const report = () => { void fetch("/api/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId, sessionId: quiz.id, email: quiz.email, demographics: quiz.demographics, answers: quiz.answers, followUps: quiz.followUps }) }).catch(() => {}); };
    report(); window.addEventListener("online", report);
    return () => window.removeEventListener("online", report);
  }, [visitorId, quiz]);
  const value = useMemo<AppContext>(() => ({ profile, ready: !!profile, storageError,
    update: fn => setProfile(p => p ? fn(p) : p),
    retake: () => setProfile(p => p ? { ...p, quiz: newQuiz() } : p),
    complete: session => setProfile(p => {
      if (!p) return p;
      const done = { ...session, stage: "done" as const, startedAt: null };
      const events = awardCompletion(p.events, done);
      if (events === p.events) return p;
      return { ...p, events, sessions: { ...p.sessions, [session.game]: done }, completedSessions: [...p.completedSessions, done], wins: session.game === "celebrate-wins" ? [...p.wins, { id: session.id, text: session.task.trim(), createdAt: new Date().toISOString() }] : p.wins };
    }),
    reset: () => { const fresh = newProfile(); setProfile(fresh); setChatOpen(false); },
    chatOpen, openChat: () => setChatOpen(true), closeChat: () => setChatOpen(false)
  }), [profile, storageError, chatOpen]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() { const context = useContext(Context); if (!context) throw new Error("AppProvider missing"); return context; }
export function useResult() { const { profile } = useApp(); const quiz = profile?.quiz; return useMemo(() => quiz?.finished ? scoreQuiz(quiz.answers, quiz.followUps) : null, [quiz]); }

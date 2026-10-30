import type { GameId } from "@/types";
export const exercises: { id: GameId; name: string; label: string; description: string; color: string; symbol: string; xp: number; time: string }[] = [
  { id: "celebrate-wins", name: "Little Wins Party", label: "Celebrate small wins", description: "That little thing you did? It deserves a little celebration.", color: "#fff0be", symbol: "★", xp: 10, time: "1 minute" },
  { id: "start-before-ready", name: "The Messy Start", label: "Start before you're ready", description: "Two minutes. One imperfect beginning. That's all it takes.", color: "#e9e0fb", symbol: "ϟ", xp: 20, time: "2 minutes" },
  { id: "good-enough", name: "Good Enough, Go!", label: "End at good enough", description: "Find your finish line. Give yourself permission to cross it.", color: "#dbf1e6", symbol: "✓", xp: 25, time: "3–5 minutes" },
  { id: "realistic-goals", name: "Tiny Mission Builder", label: "Set realistic goals", description: "Turn that mountain in your mind into one small stepping stone.", color: "#ffe5dc", symbol: "⚑", xp: 20, time: "5–20 minutes" }
];

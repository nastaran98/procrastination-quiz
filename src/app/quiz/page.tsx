import type { Metadata } from "next";
import { Quiz } from "@/components/quiz";
export const metadata: Metadata = { title: "Your little discovery" };
export default function QuizPage() { return <Quiz />; }

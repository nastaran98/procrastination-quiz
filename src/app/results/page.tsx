import type { Metadata } from "next";
import { Results } from "@/components/results";
export const metadata: Metadata = { title: "Your procrastination pattern" };
export default function ResultsPage() { return <Results />; }

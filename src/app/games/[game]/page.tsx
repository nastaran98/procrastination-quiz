import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { exercises } from "@/data/exercises";
export function generateStaticParams() { return exercises.map(e => ({ game: e.id })); }
export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> { const { game } = await params; return { title: exercises.find(e => e.id === game)?.name || "Challenge" }; }
export default async function GamePage({ params }: { params: Promise<{ game: string }> }) { const { game } = await params; const exercise = exercises.find(e => e.id === game); if (!exercise) notFound(); return <ComingSoon />; }

import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
export const metadata: Metadata = { title: "Coming soon" };
export default function GamesPage() { return <ComingSoon />; }

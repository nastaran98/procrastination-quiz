"use client";
import Link from "next/link";
import { Localized } from "@/i18n/provider";
import { Mascot } from "@/components/mascot";

export function ComingSoon() {
  return <Localized><section className="narrow page-section center"><Mascot id="dreamer" className="intro-mascot" /><h1>More to come</h1><p>Solutions will be released in future versions :)</p><Link href="/quiz" className="button">Discover My Archetype</Link></section></Localized>;
}

"use client";
import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { Localized } from "@/i18n/provider";
export default function NotFound() { return <Localized><section className="narrow page-section center"><Mascot id="dreamer" className="intro-mascot" /><span className="eyebrow">A LITTLE DETOUR</span><h1>This page wandered off.</h1><p>Let’s find our way back to a small next step.</p><Link className="button" href="/">Back to our little world</Link></section></Localized>; }

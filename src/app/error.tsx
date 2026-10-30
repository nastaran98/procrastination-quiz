"use client";
import { Localized } from "@/i18n/provider";
export default function ErrorPage({ reset }: { reset: () => void }) { return <Localized><section className="narrow page-section center"><span className="eyebrow">LET’S TAKE A BREATHER</span><h1>A little hiccup.</h1><p>Something didn’t load. Your saved progress is still in your browser.</p><button className="button" onClick={reset}>Try again</button></section></Localized>; }

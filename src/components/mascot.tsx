"use client";
import { createContext, useContext, useId, useState, type ReactNode } from "react";
import Image from "next/image";
import { archetypes } from "@/data/archetypes";
import type { ArchetypeId } from "@/types";
import { useLanguage } from "@/i18n/provider";
const Assets = createContext<string[]>([]);
export function MascotAssets({ assets, children }: { assets: string[]; children: ReactNode }) { return <Assets.Provider value={assets}>{children}</Assets.Provider>; }

export function Mascot({ id = "perfectionist", className = "", float = false, decorative = false, priority = false }: { id?: ArchetypeId; className?: string; float?: boolean; decorative?: boolean; priority?: boolean }) {
  const a = archetypes[id];
  const { t } = useLanguage();
  const uid = useId().replace(/:/g, "");
  const available = useContext(Assets);
  const [failedAsset, setFailedAsset] = useState<string | null>(null);
  if (available.includes(a.asset) && failedAsset !== a.asset) return <div className={`mascot mascot-illustration ${float ? "float" : ""} ${className}`}><Image src={`/mascots/${encodeURIComponent(a.asset)}`} alt={decorative ? "" : t("mascot.alt", { name: a.name, details: t(a.id === "perfectionist" ? "mascot.green" : "mascot.eyes") })} fill sizes="(max-width: 767px) 55vw, 320px" preload={priority} onError={() => setFailedAsset(a.asset)} /></div>;
  const worried = ["worrier", "overwhelmed", "self_doubter", "shame_spiraler"].includes(id);
  return <div className={`mascot ${float ? "float" : ""} ${className}`}>
    <svg viewBox="0 0 280 300" role={decorative ? "presentation" : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : t("mascot.svg", { name: a.name })}>
      <defs>
        <radialGradient id={`${uid}body`} cx="35%" cy="25%" r="80%"><stop offset="0" stopColor="#fffffb" /><stop offset=".65" stopColor="#fffcf2" /><stop offset="1" stopColor="#e1d6c6" /></radialGradient>
        <linearGradient id={`${uid}hair`} x1="0" y1="0" x2=".9" y2="1"><stop stopColor={a.color} /><stop offset="1" stopColor={a.color} stopOpacity=".65" /></linearGradient>
        <radialGradient id={`${uid}blush`}><stop stopColor="#f5b4a9" stopOpacity=".8" /><stop offset="1" stopColor="#f5b4a9" stopOpacity="0" /></radialGradient>
        <filter id={`${uid}shadow`} x="-50%" y="-30%" width="200%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#8d7960" floodOpacity=".16" /></filter>
        <radialGradient id={`${uid}eye`} cx="30%" cy="20%"><stop stopColor="#555064" /><stop offset="1" stopColor="#282537" /></radialGradient>
      </defs>
      <ellipse cx="142" cy="274" rx="74" ry="10" fill="#756550" opacity=".1" />
      <g filter={`url(#${uid}shadow)`}>
        <ellipse cx="103" cy="253" rx="22" ry="15" fill="#ede5d7" transform="rotate(-12 103 253)" /><ellipse cx="177" cy="253" rx="22" ry="15" fill="#ede5d7" transform="rotate(12 177 253)" />
        <path d="M64 177C39 166 34 180 44 198C51 210 64 215 75 207" fill={`url(#${uid}body)`} />
        <path d="M216 171C239 151 250 167 239 185C233 198 225 204 213 198" fill={`url(#${uid}body)`} />
        <path d="M66 126C65 73 91 52 140 52C194 52 215 81 217 130L224 203C227 242 199 258 141 258C82 258 54 241 58 204Z" fill={`url(#${uid}body)`} />
        <path d="M137 69C103 77 83 55 91 35C99 17 122 24 136 46C148 12 176 9 186 29C197 51 167 73 137 69Z" fill={`url(#${uid}hair)`} />
        <path d="M103 35Q112 29 124 43" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".3" />
      </g>
      <ellipse cx="87" cy="171" rx="23" ry="16" fill={`url(#${uid}blush)`} /><ellipse cx="192" cy="171" rx="23" ry="16" fill={`url(#${uid}blush)`} />
      <ellipse cx="109" cy="144" rx="17" ry="23" fill={`url(#${uid}eye)`} /><ellipse cx="173" cy="144" rx="17" ry="23" fill={`url(#${uid}eye)`} />
      <ellipse cx="104" cy="135" rx="5" ry="7" fill="#fff" /><ellipse cx="168" cy="135" rx="5" ry="7" fill="#fff" />
      <circle cx="114" cy="153" r="2.5" fill="#fff" opacity=".6" /><circle cx="178" cy="153" r="2.5" fill="#fff" opacity=".6" />
      {worried ? <><path d="M95 111L116 106M164 106L183 112" stroke="#6c6267" strokeWidth="4" strokeLinecap="round" /><path d="M132 186Q140 178 149 186" fill="none" stroke="#69515a" strokeWidth="3.5" strokeLinecap="round" /></> : <path d="M129 178Q141 193 153 178" fill="none" stroke="#69515a" strokeWidth="4" strokeLinecap="round" />}
      <ellipse cx="140" cy="214" rx="27" ry="20" fill="white" opacity=".35" />
      {id === "perfectionist" && <g transform="translate(190 202) rotate(15)"><rect width="35" height="45" rx="5" fill="#fff" stroke="#c3d8ce" strokeWidth="2" /><path d="M8 13l5 5 11-11M9 28h18M9 35h12" fill="none" stroke={a.color} strokeWidth="3" strokeLinecap="round" /></g>}
      {id === "dreamer" && <g fill="#f1c357"><path d="m43 83 4 10 11 1-8 7 2 11-9-6-10 6 2-11-8-7 12-1Z" /><path d="m230 61 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Z" /></g>}
      {id !== "perfectionist" && id !== "dreamer" && <text x="221" y="100" fontSize="37" fill={a.color} fontFamily="Arial, sans-serif" transform="rotate(12 220 95)">{a.symbol}</text>}
      <path d="m51 126 2 5 6 1-5 3 1 6-4-4-5 3 1-5-4-4 6-1Z" fill={a.color} opacity=".5" />
    </svg>
  </div>;
}

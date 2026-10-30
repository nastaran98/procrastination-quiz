"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Globe2, Heart, Menu, Sparkles, X } from "lucide-react";
import { Localized, useLanguage } from "@/i18n/provider";
import { useApp } from "@/store/provider";
import { Modal } from "@/components/ui";
export function Header() {
  const path = usePathname(); const [open, setOpen] = useState(false);
  const { locale, setLocale } = useLanguage();
  return <Localized><header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="ProcrastiNot home"><span className="brand-icon"><Sparkles size={21} fill="currentColor" /></span><span>Procrasti<span className="purple-text">Not</span><span className="brand-dot">.</span></span></Link><nav aria-label="Main navigation" className={open ? "nav-links is-open" : "nav-links"}>
    {[{ href: "/#how-it-works", label: "How it works" }, { href: "/#characters", label: "Meet the characters" }, { href: "/quiz", label: "Take the quiz" }].map(n => <Link key={n.href} className={path === n.href ? "active" : ""} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>)}
  </nav><div className="header-controls"><label className="language-select"><Globe2 size={16} aria-hidden="true" /><select aria-label="Language" value={locale} onChange={event => setLocale(event.target.value === "fa" ? "fa" : "en")}><option value="en" lang="en">English</option><option value="fa" lang="fa">فارسی</option></select></label><button className="icon-button mobile-menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></div></header></Localized>;
}
export function Footer() {
  const [privacy, setPrivacy] = useState(false); const [resetting, setResetting] = useState(false); const { reset } = useApp();
  return <Localized><footer className="site-footer"><div className="footer-top"><Link href="/" className="brand small"><span className="brand-icon"><Sparkles size={17} /></span>Procrasti<span className="purple-text">Not.</span></Link><p>Less overthinking. More doing.</p><span className="made-with">Made for real humans <Heart size={13} /></span></div><div className="footer-bottom"><p>A little self-discovery, not a diagnosis. Your patterns can change.</p><div><button className="text-button" onClick={() => setPrivacy(true)}>Your privacy</button><button className="text-button" onClick={() => setResetting(true)}>Reset my data</button></div></div></footer>
    {privacy && <Modal title="Your space, your information" onClose={() => setPrivacy(false)}><p>Your age, sex, email, quiz answers, and final result are saved in this browser. There are no accounts and no advertising trackers.</p><p>If a database is connected, completed quizzes also record your age, sex, email, answer to each question, calculated result, a random browser identifier, and visit timestamps.</p><p>Reset clears this browser’s data; it does not erase previously recorded database entries.</p></Modal>}
    {resetting && <Modal title="A fresh little start?" onClose={() => setResetting(false)}><p>This clears your age, sex, email, quiz answers, result, and any earlier activity from this browser.</p><div className="button-row"><button className="button secondary" onClick={() => setResetting(false)}>Keep my journey</button><button className="button" onClick={() => { reset(); setResetting(false); }}>Clear local data</button></div></Modal>}
  </Localized>;
}
export function StorageNotice() { const { storageError } = useApp(); return <Localized>{storageError && <div role="alert" className="storage-alert">Your browser can’t save progress right now. Keep this tab open to continue.</div>}</Localized>; }

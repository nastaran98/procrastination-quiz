"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { Localized, useLanguage } from "@/i18n/provider";
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={`motion-reveal ${className}`} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : .45, delay: reduced ? 0 : delay }}>{children}</motion.div>;
}
export function Progress({ value, label }: { value: number; label: string }) { const { t } = useLanguage(); return <div className="progress" role="progressbar" aria-label={t(label)} aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} /></div>; }
export function Loading() { return <Localized><div className="loading-screen" role="status"><Sparkles className="pulse" size={30} /><p>A little moment…</p></div></Localized>; }
export function Modal({ title, onClose, children, className = "" }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    const background = [...document.querySelectorAll<HTMLElement>("#main,.site-header,.site-footer,.buddy-launcher,.skip-link")].map(el => ({ el, inert: el.inert }));
    for (const { el } of background) el.inert = true;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const elements = ref.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select,[tabindex="0"]');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = old; for (const { el, inert } of background) el.inert = inert; document.removeEventListener("keydown", handler); previous?.focus(); };
  }, [onClose]);
  return createPortal(<Localized><div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>{children}</div></div></Localized>, document.body);
}
export function Celebration({ title, xp, children }: { title: string; xp: number; children?: ReactNode }) {
  return <Localized><div className="celebration" role="status"><div className="confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div><span className="celebration-star">✦</span><span className="eyebrow">A LITTLE MOMENT. A REAL WIN.</span><h2>{title}</h2><span className="xp-reward">+{xp} XP <Sparkles size={16} /></span>{children}</div></Localized>;
}

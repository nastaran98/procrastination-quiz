"use client";
import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { localeNumber, translate, type Locale } from "./translate";

interface LanguageContext { locale: Locale; setLocale: (locale: Locale) => void; t: (text: string, params?: Record<string, string | number>) => string; date: (value: string) => string }
const Context = createContext<LanguageContext>({ locale: "en", setLocale: () => {}, t: text => translate(text, "en"), date: value => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
export function LanguageProvider({ initialLocale = "en", children }: { initialLocale?: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = locale === "fa" ? "rtl" : "ltr"; document.cookie = `procrastinot-locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`; }, [locale]);
  const value = useMemo<LanguageContext>(() => ({ locale, setLocale, t: (text, params) => translate(text, locale, params), date: value => new Date(value).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric" }) }), [locale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLanguage() { return useContext(Context); }

/** Render-time text boundary: translates catalogued UI copy, never data or event handlers.
 * User-entered content is explicitly protected with translate="no".
 */
export function Localized({ children }: { children: ReactNode }) {
  const { locale, t } = useLanguage();
  function visit(node: ReactNode): ReactNode {
    if (typeof node === "string") return t(node);
    if (typeof node === "number") return localeNumber(node, locale);
    if (!isValidElement<Record<string, unknown>>(node)) return node;
    const props = node.props;
    if (props.translate === "no" || node.type === "svg") return node;
    const changes: Record<string, unknown> = {};
    if (node.type === "input" || node.type === "textarea") changes.dir = props.dir || "auto";
    for (const key of ["aria-label", "placeholder", "title", "alt", "label"]) if (typeof props[key] === "string") changes[key] = t(props[key] as string);
    if (props.children !== undefined) changes.children = Children.map(props.children as ReactNode, visit);
    return cloneElement(node, changes);
  }
  return <>{Children.map(children, visit)}</>;
}

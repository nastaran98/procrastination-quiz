import en from "./en.json";
import fa from "./fa.json";

export type Locale = "en" | "fa";
export type MessageId = keyof typeof en;
const normalize = (s: string) => s.normalize("NFKC").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
const english = en as Record<string, string>;
const persian = fa as Record<string, string>;
const lookup = new Map(Object.entries(english).map(([key, value]) => [normalize(value), persian[key] || value]));
const patterns = Object.entries(english).filter(([, value]) => /\{\w+\}/.test(value)).map(([key, value]) => {
  const names: string[] = [];
  const escaped = value.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(\w+)\}/g, (_, name: string) => { names.push(name); return "(.+?)"; });
  return { regex: new RegExp(`^${escaped}$`, "i"), names, target: persian[key] || value, specificity: value.replace(/\{\w+\}/g, "").length };
}).sort((a, b) => b.specificity - a.specificity);
export function localeNumber(value: number, locale: Locale) { return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false }).format(value); }
export function translate(text: string, locale: Locale, params?: Record<string, string | number>, depth = 0): string {
  const source = english[text] || text;
  if (params) {
    const template = locale === "fa" ? persian[text] || lookup.get(normalize(source)) || source : source;
    return template.replace(/\{(\w+)\}/g, (match, key: string) => params[key] === undefined ? match : typeof params[key] === "number" ? localeNumber(params[key] as number, locale) : translate(String(params[key]), locale, undefined, depth + 1));
  }
  if (locale === "en") return source;
  const core = source.trim();
  if (/^[\d\s:/.+%−–-]+$/.test(core)) return source.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  let result = lookup.get(normalize(core));
  if (!result && depth < 3) for (const pattern of patterns) {
    const match = core.match(pattern.regex);
    if (!match) continue;
    result = pattern.target.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
      const index = pattern.names.indexOf(name);
      return index < 0 ? placeholder : translate(match[index + 1], locale, undefined, depth + 1);
    });
    break;
  }
  if (!result && lookup.has(normalize(`The ${core}`))) result = lookup.get(normalize(`The ${core}`));
  if (result) return source.replace(core, () => result!);
  return source;
}

import type { Metadata, Viewport } from "next";
import { readdirSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { LanguageProvider, Localized } from "@/i18n/provider";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/latin-900.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "./globals.css";
import { AppProvider } from "@/store/provider";
import { MascotAssets } from "@/components/mascot";
import { Header, Footer, StorageNotice } from "@/components/shell";
export const metadata: Metadata = { title: { default: "ProcrastiNot — Less overthinking. More doing.", template: "%s · ProcrastiNot" }, description: "You're not lazy. Discover your procrastination pattern, meet your character, and turn tiny steps into real progress.", applicationName: "ProcrastiNot", manifest: "/manifest.webmanifest", icons: { icon: "/icon.svg" } };
export const viewport: Viewport = { themeColor: "#fffaf7", width: "device-width", initialScale: 1 };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await cookies()).get("procrastinot-locale")?.value === "fa" ? "fa" : "en";
  let assets: string[] = []; try { assets = readdirSync(path.join(process.cwd(), "public/mascots")); } catch {}
  return <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} data-scroll-behavior="smooth"><body><LanguageProvider initialLocale={locale}><AppProvider><MascotAssets assets={assets}><Localized><a className="skip-link" href="#main">Skip to content</a></Localized><Header /><main id="main">{children}</main><Footer /><StorageNotice /></MascotAssets></AppProvider></LanguageProvider></body></html>;
}

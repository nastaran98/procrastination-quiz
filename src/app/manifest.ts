import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "ProcrastiNot", short_name: "ProcrastiNot", description: "Less overthinking. More doing.", start_url: "/", display: "standalone", background_color: "#fffaf7", theme_color: "#9575e8", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] }; }

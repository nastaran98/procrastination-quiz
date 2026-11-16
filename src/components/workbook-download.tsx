"use client";

import { Download } from "lucide-react";
import { archetypes } from "@/data/archetypes";
import { workbookFiles } from "@/data/workbooks";
import { useLanguage } from "@/i18n/provider";
import type { ArchetypeId } from "@/types";

export function WorkbookDownload({ id, className = "" }: { id: ArchetypeId; className?: string }) {
  const { t } = useLanguage();
  return <a
    className={`button workbook-download ${className}`}
    href={`/solutions/${encodeURIComponent(workbookFiles[id])}`}
    download={`${archetypes[id].name} - Workbook.pdf`}
    aria-label={t("workbook.downloadFor", { name: archetypes[id].name })}
  ><Download size={16} aria-hidden="true" />{t("workbook.download")}</a>;
}

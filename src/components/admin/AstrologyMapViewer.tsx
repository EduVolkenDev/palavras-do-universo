"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { AstrologyChartExperience } from "@/components/astrology/AstrologyChartExperience";
import type { AstrologyClientMapRecord } from "@/lib/astrology/client-maps";
import styles from "./AstrologyMapAdminPage.module.css";
import AstrologyMapReport, { printCompleteAstrologyMap } from "./AstrologyMapReport";
import { useState } from "react";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`)
  );
}

export default function AstrologyMapViewer({ map }: { map: AstrologyClientMapRecord }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  async function exportMap() {
    setExporting(true);
    setExportError("");
    try { await printCompleteAstrologyMap(); }
    catch { setExportError("Não foi possível carregar todas as artes. Tente exportar novamente."); }
    finally { setExporting(false); }
  }

  return (
    <div className={styles.printShell}>
      <header className={styles.printToolbar}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin/mapas" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#caa96c]/50 bg-[#fffaf2] px-4 py-2.5 text-sm font-semibold text-[#6f5134] transition hover:bg-[#f8efe2]">
            <ArrowLeft size={16} aria-hidden="true" />
            Mapas salvos
          </Link>
          <button type="button" onClick={() => void exportMap()} disabled={exporting} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241b18] px-4 py-2.5 text-sm font-semibold text-[#fff7e8] transition hover:bg-[#4a352b]">
            <Download size={16} aria-hidden="true" />
            {exporting ? "Preparando PDF…" : "Exportar PDF"}
          </button>
        </div>
      </header>
      {exportError ? <p role="alert">{exportError}</p> : null}

      <section className={styles.printMeta} aria-labelledby="saved-map-title">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6b3f]">Mapa de consulta · acesso privado</p>
        <h1 id="saved-map-title" className="brand-serif mt-2 text-4xl font-semibold text-[#241b18] sm:text-5xl">{map.studentName}</h1>
        <p className="mt-3 inline-flex items-center gap-2 text-sm leading-6 text-[#6f615a]">
          <Printer size={15} aria-hidden="true" />
          Nascimento: {formatDate(map.birthData.localDate)} · {map.birthData.location.label} · criado em {formatDate(map.createdAt.slice(0, 10))}
        </p>
        <p className="mt-2 text-xs leading-5 text-[#8a7667]">Use “Exportar PDF” e escolha “Salvar como PDF” na janela de impressão.</p>
      </section>

      <div className={styles.screenChart}><AstrologyChartExperience initialChart={map.chart} initialAccessLevel="full" adminMode /></div>
      <AstrologyMapReport chart={map.chart} studentName={map.studentName} birthData={map.birthData} />
    </div>
  );
}

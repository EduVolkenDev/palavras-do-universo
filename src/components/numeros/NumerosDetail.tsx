"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Check, Copy } from "lucide-react";
import { categoryLabel, type CodeEntry } from "@/lib/numeros/codes";
import { todayKey, useKeep } from "@/lib/numeros/keep";
import { useNumerosCopy } from "@/lib/numeros/use-copy";
import { Eyebrow } from "./NumerosShell";
import styles from "./NumerosShell.module.css";

export function NumerosDetail({ code }: { code: CodeEntry | null }) {
  const { lang, m, href, say } = useNumerosCopy();
  const { keep, toggle } = useKeep();
  const [copied, setCopied] = useState(false);

  if (!code) {
    return (
      <div className={styles.narrow}>
        <h1 className={styles.h1}>{m.detail.missingTitle}</h1>
        <p className={styles.lead}>{m.detail.missingLead}</p>
        <Link className={styles.textLink} href={href("/numeros/biblioteca")}>
          {m.detail.backLibrary}
        </Link>
      </div>
    );
  }

  const saved = keep.saved.includes(code.slug);
  const note = keep.notes[`${todayKey()}:${code.slug}`];
  const title = say(code.title);

  async function copyDigits() {
    try {
      await navigator.clipboard.writeText(code!.digits);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`${styles.narrow} ${styles.rise}`}>
      <Link className={styles.textLink} href={href("/numeros/biblioteca")}>
        {m.detail.library}
      </Link>
      <Eyebrow>{categoryLabel(code.category, lang)}</Eyebrow>
      <p className={styles.digits}>{code.digits}</p>
      <h1 className={styles.h1}>{title}</h1>
      <p className={styles.lead}>{say(code.line)}</p>
      <p className={styles.muted}>{say(code.note)}</p>
      <div className={styles.row}>
        <Link className={styles.primary} href={href("/numeros/praticar", { codigo: code.slug })}>
          {m.detail.practice}
        </Link>
        <button type="button" className={styles.ghost} onClick={() => toggle(code.slug)}>
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          {saved ? m.detail.saved : m.detail.save}
        </button>
        <button type="button" className={styles.ghost} onClick={copyDigits}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? m.detail.copied : m.detail.copy}
        </button>
      </div>
      {note ? (
        <aside className={styles.card}>
          <Eyebrow>{m.detail.note}</Eyebrow>
          <p className={styles.lead}>{note}</p>
        </aside>
      ) : null}
      <p className={styles.lead}>{m.detail.caveat}</p>
    </div>
  );
}

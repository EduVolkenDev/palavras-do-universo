"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { categoryLabel, type CodeEntry } from "@/lib/numeros/codes";
import { useNumerosCopy } from "@/lib/numeros/use-copy";
import { Numeral } from "./Numeral";
import styles from "./NumerosShell.module.css";

export function CodeCard({
  code,
  saved,
  onToggle,
}: {
  code: CodeEntry;
  saved: boolean;
  onToggle: (slug: string) => void;
}) {
  const { lang, m, href, say } = useNumerosCopy();
  const title = say(code.title);

  return (
    <article className={styles.codeCard}>
      <div className={styles.cardTop}>
        <p className={styles.eyebrow}>{categoryLabel(code.category, lang)}</p>
        <button
          type="button"
          className={styles.iconButton}
          aria-pressed={saved}
          aria-label={saved ? `${m.library.unsave}: ${title}` : `${m.library.save} ${title}`}
          onClick={() => onToggle(code.slug)}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Numeral digits={code.digits} size="card" />
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardLine}>{say(code.line)}</p>
      <Link className={styles.open} href={href(`/numeros/${code.slug}`)}>
        {m.library.open}
      </Link>
    </article>
  );
}

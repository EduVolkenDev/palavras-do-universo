"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { codeForDay, type CodeEntry } from "@/lib/numeros/codes";
import { useNumerosCopy } from "@/lib/numeros/use-copy";
import { Eyebrow } from "./NumerosShell";
import styles from "./NumerosShell.module.css";

export function NumerosWisdom() {
  const { m, href, say } = useNumerosCopy();
  const [code, setCode] = useState<CodeEntry | null>(null);

  useEffect(() => {
    setCode(codeForDay(new Date()));
  }, []);

  return (
    <div className={`${styles.narrow} ${styles.rise}`}>
      <Eyebrow>{m.wisdom.eyebrow}</Eyebrow>
      <h1 className={styles.h1}>{m.wisdom.title}</h1>
      <p className={styles.lead}>{m.wisdom.lead}</p>
      <div className={styles.articles}>
        {m.wisdom.pieces.map((piece) => (
          <article key={piece.title}>
            <Eyebrow>{piece.kicker}</Eyebrow>
            <h2 className={styles.cardTitle}>{piece.title}</h2>
            <div className={styles.prose}>
              {piece.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
      <aside className={styles.panel}>
        <Eyebrow>{m.wisdom.askEyebrow}</Eyebrow>
        <h2 className={styles.cardTitle}>{m.wisdom.askTitle}</h2>
        <p className={styles.lead}>
          {m.wisdom.askLead}
          {code ? `: ${code.digits}, ${say(code.title).toLowerCase()}.` : "."}
        </p>
        {code ? (
          <Link className={styles.primary} href={href("/numeros/praticar", { codigo: code.slug })}>
            {m.wisdom.askGo}
          </Link>
        ) : null}
      </aside>
    </div>
  );
}

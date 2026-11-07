"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { codeForDay, type CodeEntry } from "@/lib/numeros/codes";
import { useNumerosCopy } from "@/lib/numeros/use-copy";
import { Eyebrow } from "./NumerosShell";
import styles from "./NumerosShell.module.css";

export function NumerosHome() {
  const { m, href, say } = useNumerosCopy();
  const [today, setToday] = useState<CodeEntry | null>(null);

  useEffect(() => {
    setToday(codeForDay(new Date()));
  }, []);

  return (
    <div className={`${styles.stack} ${styles.rise}`}>
      <section className={styles.hero}>
        <div>
          <Eyebrow>{m.home.eyebrow}</Eyebrow>
          <h1 className={styles.h1}>{m.brand}</h1>
          <p className={styles.lead}>{m.home.lead}</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href={href("/numeros/biblioteca")}>
              {m.home.seeCodes}
            </Link>
            <Link
              className={styles.ghost}
              href={href("/numeros/praticar", { codigo: today?.slug })}
            >
              {m.home.begin}
            </Link>
          </div>
        </div>
        <aside className={styles.card}>
          <Eyebrow>{m.home.today}</Eyebrow>
          {today ? (
            <>
              <p className={styles.digits}>{today.digits}</p>
              <h2 className={styles.cardTitle}>{say(today.title)}</h2>
              <p className={styles.muted}>{say(today.line)}</p>
              <Link
                className={styles.textLink}
                href={href("/numeros/praticar", { codigo: today.slug })}
              >
                {m.home.practiceThis}
              </Link>
            </>
          ) : (
            <p className={styles.lead}>{m.home.choosing}</p>
          )}
        </aside>
      </section>

      <section>
        <Eyebrow>{m.home.whatEyebrow}</Eyebrow>
        <h2 className={styles.h1}>{m.home.whatTitle}</h2>
        <div className={styles.prose}>
          {m.home.what.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>{m.home.howEyebrow}</Eyebrow>
        <h2 className={styles.h1}>{m.home.howTitle}</h2>
        <ol className={styles.grid}>
          {m.home.steps.map((step) => (
            <li key={step.n} className={styles.card}>
              <p className={styles.stepNo}>{step.n}</p>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.muted}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <Eyebrow>{m.home.whereEyebrow}</Eyebrow>
        <h2 className={styles.h1}>{m.home.whereTitle}</h2>
        <ul className={styles.grid}>
          {m.home.moments.map((moment) => (
            <li key={moment.title} className={styles.moment}>
              <h3 className={styles.cardTitle}>{moment.title}</h3>
              <p className={styles.muted}>{moment.text}</p>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <Link className={styles.ghost} href={href("/carta-do-dia")}>
            {m.nav.home === "Início" ? "Carta do dia" : "Card of the day"}
          </Link>
          <Link className={styles.ghost} href={href("/lab")}>
            {m.nav.home === "Início" ? "Rituais" : "Rituals"}
          </Link>
          <Link className={styles.ghost} href={href("/meu-universo")}>
            {m.nav.home === "Início" ? "Meu Universo" : "My Universe"}
          </Link>
        </div>
      </section>

      <section className={styles.panel}>
        <Eyebrow>{m.home.clearEyebrow}</Eyebrow>
        <h2 className={styles.h1}>{m.home.clearTitle}</h2>
        <p className={styles.lead}>{m.home.clear}</p>
      </section>

      <section>
        <h2 className={styles.h1}>{m.home.startTitle}</h2>
        <p className={styles.lead}>{m.home.startLead}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={href("/numeros/biblioteca")}>
            {m.home.seeCodes}
          </Link>
          <Link className={styles.ghost} href={href("/numeros/sabedoria")}>
            {m.home.readWisdom}
          </Link>
        </div>
      </section>
    </div>
  );
}

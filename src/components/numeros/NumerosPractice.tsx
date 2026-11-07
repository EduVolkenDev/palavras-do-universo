"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { codes, codeForDay, getCode, type CodeEntry } from "@/lib/numeros/codes";
import { todayKey, useKeep } from "@/lib/numeros/keep";
import { useNumerosCopy } from "@/lib/numeros/use-copy";
import { Eyebrow } from "./NumerosShell";
import styles from "./NumerosShell.module.css";

type Step = "escolher" | "respirar" | "escrever" | "refletir" | "fim";

export function NumerosPractice() {
  const params = useSearchParams();
  const codigo = params.get("codigo") ?? undefined;
  const { m, href, say } = useNumerosCopy();
  const { setNote, keep } = useKeep();
  const [mounted, setMounted] = useState(false);
  const [picked, setPicked] = useState<string | undefined>(codigo);
  const [step, setStep] = useState<Step>("escolher");
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(1);
  const [typed, setTyped] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (codigo) setPicked(codigo);
  }, [codigo]);

  const code: CodeEntry | undefined = useMemo(() => {
    if (picked) return getCode(picked);
    if (!mounted) return undefined;
    return codeForDay(new Date());
  }, [picked, mounted]);

  useEffect(() => {
    if (step !== "respirar") return;
    let left = 4;
    let which: "inhale" | "exhale" = "inhale";
    let round = 1;
    const timer = window.setInterval(() => {
      left -= 1;
      if (left > 0) {
        setCount(left);
        return;
      }
      if (which === "inhale") {
        which = "exhale";
        left = 4;
        setPhase("exhale");
        setCount(4);
        return;
      }
      if (round >= 4) {
        window.clearInterval(timer);
        setStep("escrever");
        return;
      }
      round += 1;
      which = "inhale";
      left = 4;
      setPhase("inhale");
      setCount(4);
      setCycle(round);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const expected = code?.digits.replace(/\D/g, "") ?? "";
  const given = typed.replace(/\D/g, "");
  const matched = given.length > 0 && expected.startsWith(given);
  const complete = expected.length > 0 && given === expected;
  const noteKey = code ? `${todayKey()}:${code.slug}` : "";

  function begin(next: CodeEntry) {
    setPicked(next.slug);
    setStep("respirar");
    setPhase("inhale");
    setCount(4);
    setCycle(1);
    setTyped("");
    setDraft(keep.notes[`${todayKey()}:${next.slug}`] ?? "");
  }

  return (
    <div className={`${styles.narrow} ${styles.rise}`}>
      <Eyebrow>{m.practice.eyebrow}</Eyebrow>
      <h1 className={styles.h1}>{m.practice.title}</h1>
      <p className={styles.lead}>{m.practice.lead}</p>

      {step === "escolher" ? (
        <section>
          {code ? (
            <div className={styles.card}>
              <Eyebrow>{codigo ? m.practice.chosen : m.practice.suggested}</Eyebrow>
              <p className={styles.digits}>{code.digits}</p>
              <h2 className={styles.cardTitle}>{say(code.title)}</h2>
              <p className={styles.muted}>{say(code.line)}</p>
              <button type="button" className={styles.primary} onClick={() => begin(code)}>
                {m.practice.start}
              </button>
            </div>
          ) : (
            <p className={styles.lead}>{m.practice.preparing}</p>
          )}
          <h2 className={styles.cardTitle} style={{ marginTop: "2.2rem" }}>
            {m.practice.other}
          </h2>
          <ul className={styles.list}>
            {codes.map((item) => (
              <li key={item.slug}>
                <button type="button" onClick={() => begin(item)}>
                  <span>{say(item.title)}</span>
                  <span>{item.digits}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === "respirar" && code ? (
        <section className={styles.breathWrap}>
          <p className={styles.muted}>
            {m.practice.cycle} {Math.min(cycle, 4)} {m.practice.of} 4
          </p>
          <div className={styles.breath}>
            <div>
              <p className={styles.digits}>{phase === "inhale" ? m.practice.inhale : m.practice.exhale}</p>
              <p className={styles.muted}>{count}</p>
            </div>
          </div>
          <p className={styles.muted}>{m.practice.breathNote}</p>
          <button type="button" className={styles.textLink} onClick={() => setStep("escrever")}>
            {m.practice.skip}
          </button>
        </section>
      ) : null}

      {step === "escrever" && code ? (
        <section>
          <Eyebrow>{say(code.title)}</Eyebrow>
          <p className={styles.digits}>{code.digits}</p>
          <label className={styles.lead}>
            {m.practice.write}
            <input
              className={styles.field}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
            />
          </label>
          <p className={styles.muted}>
            {!given
              ? m.practice.spaces
              : complete
                ? m.practice.match
                : matched
                  ? m.practice.keep
                  : m.practice.mismatch}
          </p>
          <button
            type="button"
            className={styles.primary}
            disabled={!complete}
            onClick={() => setStep("refletir")}
          >
            {m.practice.next}
          </button>
        </section>
      ) : null}

      {step === "refletir" && code ? (
        <section>
          <h2 className={styles.cardTitle}>{m.practice.question}</h2>
          <p className={styles.muted}>
            {m.practice.questionNote} {code.digits}.
          </p>
          <textarea
            className={styles.note}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
          />
          <div className={styles.row}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                if (noteKey) setNote(noteKey, draft);
                setStep("fim");
              }}
            >
              {m.practice.saveClose}
            </button>
            <button type="button" className={styles.ghost} onClick={() => setStep("fim")}>
              {m.practice.close}
            </button>
          </div>
        </section>
      ) : null}

      {step === "fim" && code ? (
        <section>
          <h2 className={styles.h1}>{m.practice.doneTitle}</h2>
          <p className={styles.lead}>
            {m.practice.doneLead} {say(code.title)} {m.practice.doneWhile}
          </p>
          {keep.notes[noteKey] ? <blockquote className={styles.quote}>{keep.notes[noteKey]}</blockquote> : null}
          <div className={styles.row}>
            <button type="button" className={styles.primary} onClick={() => setStep("escolher")}>
              {m.practice.another}
            </button>
            <Link className={styles.ghost} href={href(`/numeros/${code.slug}`)}>
              {m.practice.backCode}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

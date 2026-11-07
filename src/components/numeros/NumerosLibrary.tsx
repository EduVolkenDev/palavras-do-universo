"use client";

import { useMemo, useState } from "react";
import { categories, codes, type CategoryId } from "@/lib/numeros/codes";
import { useKeep } from "@/lib/numeros/keep";
import { useNumerosCopy } from "@/lib/numeros/use-copy";
import { CodeCard } from "./CodeCard";
import { Eyebrow } from "./NumerosShell";
import styles from "./NumerosShell.module.css";

type Filter = "todos" | "guardados" | CategoryId;

export function NumerosLibrary() {
  const { m, say } = useNumerosCopy();
  const { keep, toggle } = useKeep();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digitsQuery = q.replace(/\s/g, "");
    return codes.filter((code) => {
      if (filter === "guardados" && !keep.saved.includes(code.slug)) return false;
      if (filter !== "todos" && filter !== "guardados" && code.category !== filter) return false;
      if (!q) return true;
      const haystack = [code.title.pt, code.title.en, code.line.pt, code.line.en]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q) || code.digits.replace(/\s/g, "").includes(digitsQuery);
    });
  }, [filter, keep.saved, query]);

  const chips: { id: Filter; label: string }[] = [
    { id: "todos", label: m.library.all },
    { id: "guardados", label: m.library.saved },
    ...categories.map((category) => ({ id: category.id, label: say(category.label) })),
  ];

  return (
    <div className={styles.rise}>
      <Eyebrow>{m.library.eyebrow}</Eyebrow>
      <h1 className={styles.h1}>{m.library.title}</h1>
      <p className={styles.lead}>{m.library.lead}</p>
      <label>
        <span className="sr-only">{m.library.search}</span>
        <input
          className={styles.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={m.library.search}
        />
      </label>
      <div className={styles.chips} role="tablist" aria-label={m.library.title}>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={filter === chip.id}
            className={styles.chip}
            onClick={() => setFilter(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className={styles.lead}>
          {filter === "guardados" ? m.library.emptySaved : m.library.emptyQuery}
        </p>
      ) : (
        <div className={styles.cards}>
          {visible.map((code) => (
            <CodeCard
              key={code.slug}
              code={code}
              saved={keep.saved.includes(code.slug)}
              onToggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

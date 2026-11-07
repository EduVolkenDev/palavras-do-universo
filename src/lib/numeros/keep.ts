"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "pdu-numeros-v1";

export type Keep = {
  saved: string[];
  notes: Record<string, string>;
};

function empty(): Keep {
  return { saved: [], notes: {} };
}

export function loadKeep(): Keep {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<Keep>;
    const saved = Array.isArray(parsed.saved)
      ? parsed.saved.filter((item): item is string => typeof item === "string")
      : [];
    const notes: Record<string, string> = {};
    if (parsed.notes && typeof parsed.notes === "object") {
      for (const [key, value] of Object.entries(parsed.notes)) {
        if (typeof value === "string") notes[key] = value;
      }
    }
    return { saved, notes };
  } catch {
    return empty();
  }
}

function writeKeep(keep: Keep) {
  localStorage.setItem(KEY, JSON.stringify(keep));
}

export function todayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function useKeep() {
  const [keep, setKeep] = useState<Keep>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setKeep(loadKeep());
    setReady(true);
  }, []);

  const toggle = useCallback((slug: string) => {
    setKeep((prev) => {
      const saved = prev.saved.includes(slug)
        ? prev.saved.filter((item) => item !== slug)
        : [...prev.saved, slug];
      const next = { ...prev, saved };
      writeKeep(next);
      return next;
    });
  }, []);

  const setNote = useCallback((key: string, note: string) => {
    setKeep((prev) => {
      const notes = { ...prev.notes };
      const trimmed = note.trim();
      if (trimmed) notes[key] = trimmed;
      else delete notes[key];
      const next = { ...prev, notes };
      writeKeep(next);
      return next;
    });
  }, []);

  return { keep, ready, toggle, setNote };
}

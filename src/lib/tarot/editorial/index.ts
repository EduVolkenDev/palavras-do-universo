import { MAJOR_EDITORIAL } from "./major.ts";
import { WANDS_EDITORIAL } from "./wands.ts";
import { CUPS_EDITORIAL } from "./cups.ts";
import { SWORDS_EDITORIAL } from "./swords.ts";
import { PENTACLES_EDITORIAL } from "./pentacles.ts";
import type { TarotCardEditorial } from "./types.ts";

// Server-only consumer: pages pass only their own bilingual entry to the client.
export const TAROT_EDITORIAL: Readonly<Record<string, TarotCardEditorial>> = {
  ...MAJOR_EDITORIAL,
  ...WANDS_EDITORIAL,
  ...CUPS_EDITORIAL,
  ...SWORDS_EDITORIAL,
  ...PENTACLES_EDITORIAL,
};

export function getTarotEditorial(key: string): TarotCardEditorial | null {
  return Object.hasOwn(TAROT_EDITORIAL, key) ? TAROT_EDITORIAL[key] : null;
}

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const cardsDirectory = join(process.cwd(), "public", "assets");
const suits = ["wands", "cups", "swords", "pentacles"];
const ranks = [
  "ace",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "page",
  "knight",
  "queen",
  "king",
];

const expectedFiles = [
  ...Array.from(
    { length: 22 },
    (_, number) => `major-${String(number).padStart(2, "0")}-`
  ),
  ...suits.flatMap((suit) => ranks.map((rank) => `${suit}-${rank}.webp`)),
];

const entries = await readdir(cardsDirectory);
const webpFiles = entries.filter((entry) => entry.endsWith(".webp"));
const resolvedFiles = expectedFiles.map((expected) => {
  if (expected.endsWith(".webp")) {
    return webpFiles.includes(expected) ? expected : null;
  }

  const matches = webpFiles.filter((file) => file.startsWith(expected));
  return matches.length === 1 ? matches[0] : null;
});
const missing = expectedFiles.filter((_, index) => !resolvedFiles[index]);
const ambiguous = expectedFiles
  .filter((expected) => !expected.endsWith(".webp"))
  .flatMap((expected) => {
    const matches = webpFiles.filter((file) => file.startsWith(expected));
    return matches.length > 1 ? [`${expected}* -> ${matches.join(", ")}`] : [];
  });
const empty = [];

for (const file of resolvedFiles) {
  if (!file) continue;
  if ((await stat(join(cardsDirectory, file))).size === 0) {
    empty.push(file);
  }
}

if (missing.length > 0 || ambiguous.length > 0 || empty.length > 0) {
  console.error("Tarot asset validation failed.");
  if (missing.length > 0) console.error(`Missing: ${missing.join(", ")}`);
  if (ambiguous.length > 0) console.error(`Ambiguous: ${ambiguous.join("; ")}`);
  if (empty.length > 0) console.error(`Empty: ${empty.join(", ")}`);
  process.exit(1);
}

console.log("Tarot assets valid: 78 complete WebP cards in public/assets.");

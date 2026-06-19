import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const cardsDirectory = join(process.cwd(), "public", "tarot", "cards");
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
const missing = expectedFiles.filter((expected) =>
  expected.endsWith(".webp")
    ? !webpFiles.includes(expected)
    : !webpFiles.some((file) => file.startsWith(expected))
);
const empty = [];

for (const file of webpFiles) {
  if ((await stat(join(cardsDirectory, file))).size === 0) {
    empty.push(file);
  }
}

if (webpFiles.length !== 78 || missing.length > 0 || empty.length > 0) {
  console.error("Tarot asset validation failed.");
  console.error(`Expected 78 WebP cards; found ${webpFiles.length}.`);
  if (missing.length > 0) console.error(`Missing: ${missing.join(", ")}`);
  if (empty.length > 0) console.error(`Empty: ${empty.join(", ")}`);
  process.exit(1);
}

console.log("Tarot assets valid: 78 complete WebP cards.");

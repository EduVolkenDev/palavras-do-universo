import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// Resize the supplied artwork only: preserve its composition, colors and alpha.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/prepare-brand-assets.mjs /absolute/path/to/official-logo.webp");
const sourcePath = resolve(source);
const assets = join(root, "public/assets");
mkdirSync(assets, { recursive: true });
const outputs = [
  ["assets/new-palavrasuniverso-logo.webp", 1600],
  ["assets/new-palavrasuniverso-logo-512.webp", 512],
  // Compatibility URLs can be embedded in emails or previously saved content.
  ["assets/pdu-official-logo-1600.webp", 1600],
  ["assets/pdu-official-logo-512.webp", 512],
  ["assets/pdu-official-logo-google.png", 512],
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
];

for (const [name, size] of outputs) {
  const destination = join(root, "public", name);
  execFileSync("magick", [sourcePath, "-auto-orient", "-strip", "-resize", `${size}x${size}`,
    ...(name.endsWith(".webp") ? ["-quality", "90", "-define", "webp:method=6"] : []), destination]);
  console.log(`${name}: ${size} × ${size}, ${Math.round(statSync(destination).size / 1024)} KB`);
}
writeFileSync(join(assets, "pdu-brand-manifest.json"), `${JSON.stringify({
  brand: "Palavras do Universo",
  version: "2026-10-27",
  source: "new-palavrasuniverso-logo.webp",
  sourceSha256: createHash("sha256").update(readFileSync(sourcePath)).digest("hex"),
  treatment: "Proportional resizing only; original alpha and composition preserved.",
  logo: "/assets/new-palavrasuniverso-logo.webp",
  compactLogo: "/assets/new-palavrasuniverso-logo-512.webp",
}, null, 2)}\n`);

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function rel(path) {
  return relative(root, path).replaceAll("\\", "/");
}

function walk(directory, options = {}) {
  if (!existsSync(directory)) return [];

  const entries = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    const normalized = rel(fullPath);

    if (options.skip?.some((skip) => normalized.startsWith(skip))) continue;

    if (entry.isDirectory()) {
      entries.push(...walk(fullPath, options));
    } else {
      entries.push(fullPath);
    }
  }

  return entries;
}

function listDirectories(directory) {
  if (!existsSync(directory)) return [];

  const directories = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (!entry.isDirectory()) continue;
    directories.push(fullPath);
    directories.push(...listDirectories(fullPath));
  }

  return directories;
}

function readText(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function addFailure(message) {
  failures.push(message);
}

const publicDirectories = listDirectories(join(root, "public")).map(rel);
const unexpectedPublicDirectories = publicDirectories.filter(
  (directory) => directory !== "public/assets"
);

if (unexpectedPublicDirectories.length > 0) {
  addFailure(
    `Unexpected public directories. Keep public assets flat in public/assets only: ${unexpectedPublicDirectories.join(", ")}`
  );
}

const assetSubdirectories = listDirectories(join(root, "public", "assets")).map(rel);
if (assetSubdirectories.length > 0) {
  addFailure(
    `Nested asset directories are not allowed: ${assetSubdirectories.join(", ")}`
  );
}

const sourceFiles = [
  ...walk(join(root, "src")),
  ...walk(join(root, "scripts")),
  ...walk(join(root, "docs")),
  ...walk(join(root, "public"), { skip: ["public/assets/"] }),
].filter((file) => /\.(css|js|jsx|json|md|mjs|ts|tsx)$/.test(file));

const allowedLegacyMentions = new Set([
  "scripts/audit-foundation-premium.mjs",
  "src/app/meu-universo/page.tsx",
]);

for (const file of sourceFiles) {
  const normalized = rel(file);
  const text = readText(file);
  const lines = text.split("\n");

  lines.forEach((line, index) => {
    const location = `${normalized}:${index + 1}`;

    if (/\/assets\/(homepage|product-icons|spreads)\//.test(line)) {
      addFailure(`${location} references a legacy nested /assets path.`);
    }

    if (
      /public\/tarot|["']public["']\s*,\s*["']tarot["']/.test(line) &&
      !allowedLegacyMentions.has(normalized)
    ) {
      addFailure(`${location} references legacy public/tarot storage.`);
    }

    if (line.includes("/tarot/cards/")) {
      const isAllowedNormalizer =
        allowedLegacyMentions.has(normalized) &&
        (line.includes("legacyTarotPath") ||
          normalized === "scripts/audit-foundation-premium.mjs");
      if (!isAllowedNormalizer) {
        addFailure(`${location} references legacy /tarot/cards route.`);
      }
    }
  });
}

const literalAssetPattern =
  /\/assets\/[^\s"',)]+?\.(?:webp|png|jpe?g|svg|gif|ico|json|mp4|webm|css|js)/g;
const missingAssets = [];
let literalAssetReferences = 0;

for (const file of sourceFiles) {
  const normalized = rel(file);
  const text = readText(file);

  for (const match of text.matchAll(literalAssetPattern)) {
    const assetPath = match[0].replace(/[?#].*$/g, "");
    if (assetPath.includes("${")) continue;

    literalAssetReferences += 1;
    if (!existsSync(join(root, "public", assetPath))) {
      missingAssets.push(`${normalized} -> ${assetPath}`);
    }
  }
}

if (missingAssets.length > 0) {
  addFailure(`Missing referenced assets:\n${missingAssets.join("\n")}`);
}

const pduAssets = readText(join(root, "src", "lib", "pdu-assets.ts"));
if (!pduAssets.includes('cardOfTheDayMobile: "/assets/carta-do-dia-premium.webp"')) {
  addFailure(
    "PDU_ASSETS.spreads.cardOfTheDayMobile must use /assets/carta-do-dia-premium.webp."
  );
}

const tiradasPage = readText(join(root, "src", "app", "tiradas", "page.tsx"));
if (!tiradasPage.includes("visual: PDU_ASSETS.spreads.cardOfTheDayMobile")) {
  addFailure(
    "/tiradas should render Carta do Dia through PDU_ASSETS.spreads.cardOfTheDayMobile."
  );
}

const copiedAssets = walk(join(root, "public", "assets")).filter((file) =>
  /\scopy\.[^.]+$/.test(file)
);
if (copiedAssets.length > 0) {
  addFailure(
    `Copy-named assets are not allowed in public/assets: ${copiedAssets.map(rel).join(", ")}`
  );
}

const largeWebpAssets = walk(join(root, "public", "assets"))
  .filter((file) => file.endsWith(".webp"))
  .map((file) => ({ file, size: statSync(file).size }))
  .filter((asset) => asset.size > 2_000_000)
  .sort((a, b) => b.size - a.size);

if (largeWebpAssets.length > 0) {
  addFailure(
    `WebP assets over 2 MB are not allowed in public/assets: ${largeWebpAssets
      .map((asset) => `${rel(asset.file)} (${(asset.size / 1024 / 1024).toFixed(1)} MB)`)
      .join(", ")}`
  );
}

if (failures.length > 0) {
  console.error("Foundation premium audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Foundation premium audit passed: ${literalAssetReferences} literal /assets references checked.`
);

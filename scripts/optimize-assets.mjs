import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const root = process.cwd();
const assetDir = join(root, "public", "assets");
const dryRun = process.argv.includes("--dry-run");
const optimizeAll = process.argv.includes("--all");
const backupDir = join(tmpdir(), `pdu-assets-before-optimize-${Date.now()}`);
const minSavings = 0.08;
const minCandidateSize = 2_000_000;
const maxDefaultCandidates = 20;

const tarotPattern = /^(major-|cups-|pentacles-|swords-|wands-).+\.webp$/;
const mobilePattern = /(?:-mobile|mobile-|pdu-hero-.+-mobile)\.webp$/;
const heroPattern =
  /^(new-pdu-dock\d*|pdu-dock|pdu-hero-.+|palavrasuniverso|palavrasuniverso-1600)\.webp$/;

function rel(path) {
  return relative(root, path).replaceAll("\\", "/");
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`
    );
  }

  return result.stdout.trim();
}

function imageInfo(file) {
  const output = run("magick", ["identify", "-format", "%w %h", file]);
  const [width, height] = output.split(/\s+/).map(Number);
  return { width, height };
}

function profileFor(name) {
  if (tarotPattern.test(name)) {
    return { resize: "1200x1800>", quality: "84", label: "tarot" };
  }

  if (mobilePattern.test(name)) {
    return { resize: "1000x1000>", quality: "86", label: "mobile" };
  }

  if (heroPattern.test(name)) {
    return { resize: "1600x1600>", quality: "88", label: "hero" };
  }

  return { resize: "1800x1800>", quality: "86", label: "editorial" };
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

if (!existsSync(assetDir)) {
  throw new Error("public/assets does not exist.");
}

run("magick", ["-version"]);

const files = readdirSync(assetDir)
  .filter((name) => name.endsWith(".webp"))
  .filter((name) => !/\scopy\.webp$/.test(name))
  .map((name) => join(assetDir, name));

const candidates = files
  .map((file) => {
    const name = basename(file);
    const info = imageInfo(file);
    const size = statSync(file).size;
    const profile = profileFor(name);

    return { file, name, size, ...info, ...profile };
  })
  .filter((asset) => asset.size > minCandidateSize)
  .sort((a, b) => b.size - a.size)
  .slice(0, optimizeAll ? undefined : maxDefaultCandidates);

if (candidates.length === 0) {
  console.log("No asset optimization candidates found.");
  process.exit(0);
}

if (!dryRun) mkdirSync(backupDir, { recursive: true });

const optimized = [];
const skipped = [];

for (const asset of candidates) {
  const tmp = join(tmpdir(), `${asset.name}.${Date.now()}.optimized.webp`);

  run("magick", [
    asset.file,
    "-auto-orient",
    "-strip",
    "-resize",
    asset.resize,
    "-quality",
    asset.quality,
    "-define",
    "webp:method=4",
    tmp,
  ]);

  const nextSize = statSync(tmp).size;
  const savings = 1 - nextSize / asset.size;

  if (nextSize >= asset.size || savings < minSavings) {
    skipped.push({
      ...asset,
      nextSize,
      reason: `saving ${(savings * 100).toFixed(1)}% is below threshold`,
    });
    unlinkSync(tmp);
    continue;
  }

  const nextInfo = imageInfo(tmp);
  optimized.push({
    ...asset,
    nextSize,
    nextWidth: nextInfo.width,
    nextHeight: nextInfo.height,
    savings,
  });

  if (!dryRun) {
    copyFileSync(asset.file, join(backupDir, asset.name));
    renameSync(tmp, asset.file);
  } else {
    unlinkSync(tmp);
  }
}

const mode = dryRun ? "dry run" : "applied";
console.log(`Asset optimization ${mode}: ${optimized.length} optimized, ${skipped.length} skipped.`);

for (const item of optimized) {
  console.log(
    `- ${rel(item.file)} [${item.label}] ${item.width}x${item.height} ${formatBytes(
      item.size
    )} -> ${item.nextWidth}x${item.nextHeight} ${formatBytes(item.nextSize)} (${(
      item.savings * 100
    ).toFixed(1)}% smaller)`
  );
}

if (skipped.length > 0) {
  console.log("Skipped:");
  for (const item of skipped) {
    console.log(
      `- ${rel(item.file)} ${formatBytes(item.size)} -> ${formatBytes(item.nextSize)}; ${
        item.reason
      }`
    );
  }
}

if (!dryRun) {
  console.log(`Original optimized files copied to ${backupDir}`);
}

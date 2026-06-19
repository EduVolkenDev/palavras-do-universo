import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

const inputExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".heic",
  ".avif",
  ".tif",
  ".tiff",
]);

const args = process.argv.slice(2);
const sourceArg = args.find((arg) => !arg.startsWith("--"));
const sourceDir = resolve(sourceArg ?? "/Users/eduardovolken_1/Downloads/lynxes-webp");
const force = args.includes("--force");
const recursive = !args.includes("--flat");
const outDirArg = args.find((arg) => arg.startsWith("--out-dir="));
const outDir = outDirArg ? resolve(outDirArg.split("=").slice(1).join("=")) : null;
const qualityArg = args.find((arg) => arg.startsWith("--quality="));
const quality = qualityArg ? Number(qualityArg.split("=")[1]) : 92;

function commandExists(command) {
  const result = spawnSync("/usr/bin/env", ["which", command], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function walk(dir) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const path = join(dir, entry);
      const stats = statSync(path);

      if (stats.isDirectory()) {
        if (!recursive || entry === "_organized") return [];
        return walk(path);
      }

      return [path];
    })
    .filter((path) => inputExtensions.has(extname(path).toLowerCase()));
}

function outputPathFor(inputPath) {
  const outputBase = `${basename(inputPath, extname(inputPath))}.webp`;

  if (!outDir) return join(dirname(inputPath), outputBase);

  mkdirSync(outDir, { recursive: true });
  return join(outDir, outputBase);
}

if (!existsSync(sourceDir)) {
  console.error(`Source folder not found: ${sourceDir}`);
  process.exit(1);
}

if (!commandExists("magick")) {
  console.error("ImageMagick `magick` command not found.");
  process.exit(1);
}

if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
  console.error("Quality must be a number between 1 and 100.");
  process.exit(1);
}

const inputs = walk(sourceDir);
const results = {
  sourceDir,
  outDir: outDir ?? "same folder as source image",
  quality,
  scanned: inputs.length,
  converted: [],
  skipped: [],
  failed: [],
};

for (const inputPath of inputs) {
  const outputPath = outputPathFor(inputPath);

  if (!force && existsSync(outputPath)) {
    results.skipped.push({ input: inputPath, output: outputPath, reason: "exists" });
    continue;
  }

  const converted = spawnSync(
    "magick",
    [
      inputPath,
      "-auto-orient",
      "-strip",
      "-define",
      "webp:method=6",
      "-quality",
      String(quality),
      outputPath,
    ],
    { encoding: "utf8" }
  );

  if (converted.status === 0) {
    results.converted.push({ input: inputPath, output: outputPath });
  } else {
    results.failed.push({
      input: inputPath,
      output: outputPath,
      error: converted.stderr?.trim() || converted.stdout?.trim() || "unknown error",
    });
  }
}

console.log(JSON.stringify(results, null, 2));

if (results.failed.length > 0) {
  process.exitCode = 1;
}
